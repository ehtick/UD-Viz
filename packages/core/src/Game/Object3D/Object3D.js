const THREE = require('three');
const JSONUtils = require('../../Components/JSONUtils');
const Collider = require('./Components/Collider');
const { Base } = require('./Components/Component');
const Script = require('./Components/Script');
const packageJSON = require('@ud-viz/core/package.json');

// GameObject Components
// const WorldScript = require('./Components/WorldScript');
// const BrowserScript = require('./Components/BrowserScript');
// const Render = require('./Components/Render');
// const Collider = require('./Components/Collider');
// const Audio = require('./Components/Audio');

/**
 * Objects to compose a Game
 * Work with a graph hierarchy
 * GameObject have component to handle different behaviour
 */
const GameObject = class {
  /**
   * Create a new GameObject
   *
   * @param {JSON} json data to init this
   * @param {GameObject} parent the parent of this (optional)
   */
  constructor(json, parent) {
    if (!json) throw new Error('no json');

    // Id
    this.uuid = json.uuid || THREE.Math.generateUUID();

    // Components
    this.components = {};
    this.setComponentModelsFromJSON(json);

    // Name
    this.name = json.name || 'none';

    // Default object3d where transform is stored
    this.object3D = new THREE.Object3D();
    this.object3D.name = this.name + '_object3D';
    this.object3D.rotation.reorder('ZXY');
    // Stock data in userData
    this.object3D.userData = {
      gameObjectUUID: this.getUUID(),
    };
    this.setFromTransformJSON(json.transform);

    /**
     * True mean the object is not supposed to move during the game
     * for simulation/network opti
     *
     * @type {boolean}
     */
    this.static = json.static || false;

    // Outdated flag for network opti
    this.outdated = json.outdated || false;

    // Graph hierarchy
    const children = [];
    if (json.children && json.children.length > 0) {
      json.children.forEach((child) => {
        children.push(new GameObject(child, this));
      });
    }
    this.children = children;

    // Uuid of parent if one
    this.parentUUID = null;
    this.setParent(parent);

    // Assets has been initialized
    this.initialized = false;

    // Update the object state in updateFromGO (or not)
    this.noLocalUpdate = json.noLocalUpdate || false;

    // Freeze components and transform
    this.freeze = json.freeze || false;

    // List to force certain component to be serialize
    this.forceSerializeComponentModels =
      json.forceSerializeComponentModels || [];
  }

  /**
   * Bind transform of go into this
   *
   * @param {GameObject} go
   */
  setTransformFromGO(go) {
    if (this.freeze) return;
    this.object3D.position.copy(go.object3D.position);
    this.object3D.scale.copy(go.object3D.scale);
    this.object3D.rotation.copy(go.object3D.rotation);
  }

  /**
   * Set transform of object3D from json
   *
   * @param {JSON} json
   */
  setFromTransformJSON(json = {}) {
    if (this.freeze) return;

    if (json.position) {
      this.object3D.position.fromArray(json.position);
      JSONUtils.parseVector3(this.object3D.position);
    } else {
      this.object3D.position.fromArray([0, 0, 0]);
    }

    if (json.rotation) {
      this.object3D.rotation.fromArray(json.rotation);
      JSONUtils.parseVector3(this.object3D.rotation);
    } else {
      this.object3D.rotation.fromArray([0, 0, 0]);
    }

    if (json.scale) {
      this.object3D.scale.fromArray(json.scale);
      JSONUtils.parseVector3(this.object3D.scale);
    } else {
      this.object3D.scale.fromArray([1, 1, 1]);
    }
  }

  setTransformFromObject3D(object3D) {
    if (this.freeze) return;

    this.object3D.position.copy(object3D.position);
    this.object3D.scale.copy(object3D.scale);
    this.object3D.rotation.copy(object3D.rotation);
  }

  /**
   * Replace data of this with a json object
   *
   * @param {JSON} json
   */
  setFromJSON(json) {
    this.components = {}; // Clear
    this.setComponentModelsFromJSON(json);
    this.setFromTransformJSON(json.transform);
    this.name = json.name;
    this.static = json.static;
    this.outdated = json.outdated;

    this.children.forEach(function (c) {
      const uuidChild = c.getUUID();
      let jsonChild;
      for (let i = 0; i < json.children.length; i++) {
        if (json.children[i].uuid == uuidChild) {
          jsonChild = json.children[i];
          break;
        }
      }
      if (!jsonChild) {
        // C no longer in scene
        return;
      }

      c.setFromJSON(jsonChild);
    });
  }

  initialize() {
    if (this.initialized) console.warn('GameObject is already initialized');
    this.initialized = true;
  }

  isInitialized() {
    return this.initialized;
  }

  /**
   * Return the world transform of this
   *
   * @returns {object}
   */
  computeWorldTransform() {
    const euler = new THREE.Euler();
    euler.reorder('ZXY');
    const result = {
      position: new THREE.Vector3(),
      rotation: euler,
      scale: new THREE.Vector3(),
    };

    let current = this;
    do {
      result.position.add(current.getPosition());

      result.rotation.x += current.getRotation().x;
      result.rotation.y += current.getRotation().y;
      result.rotation.z += current.getRotation().z;

      result.scale.multiply(current.getScale());

      current = current.parent;
    } while (current);

    return result;
  }

  /**
   * Add vector to position of this
   *
   * @param {THREE.Vector3} vector
   */
  move(vector) {
    if (this.freeze) return;

    this.object3D.position.add(vector);
  }

  /**
   * Clamp rotation between 0 => 2*PI
   */
  clampRotation() {
    const r = this.object3D.rotation;
    r.x = (Math.PI * 4 + r.x) % (Math.PI * 2);
    r.y = (Math.PI * 4 + r.y) % (Math.PI * 2);
    r.z = (Math.PI * 4 + r.z) % (Math.PI * 2);
  }

  /**
   * Add vector to rotation of this
   *
   * @param {THREE.Vector3} vector
   */
  rotate(vector) {
    if (this.freeze) return;

    this.object3D.rotateZ(vector.z);
    this.object3D.rotateX(vector.x);
    this.object3D.rotateY(vector.y);

    this.clampRotation();
  }

  /**
   * Return worldScripts of this
   *
   * @returns {object}
   */
  fetchWorldScripts() {
    const c = this.getComponent(WorldScript.Model.TYPE);
    if (!c) return null;
    return c.getController().getScripts();
  }

  fetchBrowserScripts() {
    const c = this.getComponent(BrowserScript.TYPE);
    if (!c) return null;
    return c.getScripts();
  }

  /**
   * Return the default forward vector
   *
   * @returns {THREE.Vector3}
   */
  getDefaultForward() {
    return new THREE.Vector3(0, 1, 0);
  }

  /**
   * Return the root gameobject of the graph hierarchy
   *
   * @returns {GameObject}
   */
  computeRoot() {
    if (!this.parent) return this;
    return this.parent.computeRoot();
  }

  /**
   * Compute the forward vector of this
   *
   * @returns {THREE.Vector3}
   */
  computeForwardVector() {
    const quaternion = new THREE.Quaternion().setFromEuler(
      this.object3D.rotation
    );
    const result = this.getDefaultForward().applyQuaternion(quaternion);
    return result;
  }

  /**
   * Compute the backward vector of this
   *
   * @returns {THREE.Vector3}
   */
  computeBackwardVector() {
    const quaternion = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 0, 1),
      Math.PI
    );
    return this.computeForwardVector().applyQuaternion(quaternion);
  }

  /**
   * Compute Upward vector
   *
   * @returns {THREE.Vector3}
   */
  computeUpVector() {
    const quaternion = new THREE.Quaternion().setFromEuler(
      this.object3D.rotation
    );
    // Console.log('coucou UP');
    const result = THREE.Object3D.DefaultUp.clone().applyQuaternion(quaternion);
    return result;
  }

  /**
   * Compute the downward vector
   *
   * @returns {THREE.Vector3}
   */
  computeDownVector() {
    const quaternion = new THREE.Quaternion().setFromEuler(
      this.object3D.rotation
    );
    // Console.log('coucou DOWN');
    const result = THREE.Object3D.DefaultUp.clone()
      .negate()
      .applyQuaternion(quaternion);
    return result;
  }

  /**
   * Compute the left translation vector
   *
   * @returns {THREE.Vector3}
   */
  computeLeftVector() {
    const quaternion = new THREE.Quaternion().setFromEuler(
      this.object3D.rotation
    );
    // Console.log('coucou LEFT');
    const result = this.getDefaultForward()
      .applyAxisAngle(THREE.Object3D.DefaultUp, Math.PI / 2)
      .applyQuaternion(quaternion);
    return result;
  }

  /**
   * Compute the right translation vector
   *
   * @returns {THREE.Vector3}
   */
  computeRightVector() {
    const quaternion = new THREE.Quaternion().setFromEuler(
      this.object3D.rotation
    );
    // Console.log('coucou RIGHT');
    const result = this.getDefaultForward()
      .applyAxisAngle(THREE.Object3D.DefaultUp, -Math.PI / 2)
      .applyQuaternion(quaternion);
    return result;
  }

  /**
   * Remove the gameobject from its parent
   * Remove its object3D from the scene
   */
  removeFromParent() {
    if (this.parent) {
      const _this = this;
      this.parent.children = this.parent.children.filter(function (ele) {
        return ele.getUUID() != _this.getUUID();
      });
    } else {
      console.warn('no deleted because no parent ', this.toJSON());
    }
  }

  /**
   *
   * @returns {boolean}
   */
  isStatic() {
    return this.static;
  }

  /**
   *
   * @returns {boolean}
   */
  isOutdated() {
    return this.outdated;
  }

  /**
   *
   * @param {boolean} value
   */
  setOutdated(value) {
    this.outdated = value;
  }

  /**
   * Set Components with a json object
   *
   * @param {JSON} json
   */
  setComponentModelsFromJSON(json) {
    const jsonMap = json.componentModels;
    const _this = this;

    if (!jsonMap) return;

    for (const type in jsonMap) {
      const componentModelJSON = jsonMap[type];

      switch (type) {
        case Render.Model.TYPE:
          if (_this.components[Render.Model.TYPE])
            console.warn('multiple component');

          _this.components[Render.Model.TYPE] = new Component(
            new Render.Model(componentModelJSON)
          );

          break;
        case Audio.Model.TYPE:
          if (_this.components[Audio.Model.TYPE])
            console.warn('multiple component');

          _this.components[Audio.Model.TYPE] = new Component(
            new Audio.Model(componentModelJSON)
          );

          break;
        case WorldScript.Model.TYPE:
          if (_this.components[WorldScript.Model.TYPE])
            console.warn('multiple component');

          _this.components[WorldScript.Model.TYPE] = new Component(
            new WorldScript.Model(componentModelJSON)
          );

          break;
        case BrowserScript.Model.TYPE:
          if (_this.components[BrowserScript.Model.TYPE])
            console.warn('multiple component');

          _this.components[BrowserScript.Model.TYPE] = new Component(
            new BrowserScript.Model(componentModelJSON)
          );

          break;
        case Collider.Model.TYPE:
          if (_this.components[Collider.Model.TYPE])
            console.warn('multiple component');

          _this.components[Collider.Model.TYPE] = new Component(
            new Collider.Model(componentModelJSON)
          );

          break;
        default:
          console.warn('wrong type component', type, componentModelJSON);
      }
    }
  }

  getObject3D() {
    return this.object3D;
  }

  /**
   * Get a gameobject component with a given uuid
   *
   * @param {string} uuid the uuid of the component
   * @returns {GameObject.Component} the gameobject component
   */
  getComponentByUUID(uuid) {
    for (const key in this.components) {
      const c = this.components[key];
      if (c.getModel().getUUID() == uuid) return c;
    }

    return null;
  }

  /**
   * Return a clone of this
   *
   * @returns {GameObject}
   */
  clone() {
    return new GameObject(this.toJSON(true));
  }

  /**
   * Apply a callback to all gameobject of the hierarchy
   * Dont apply it to gameobject parent of this
   *
   * @param {Function} cb the callback to apply take a gameobject as first argument
   * @returns {boolean} true stop the propagation (opti) false otherwise
   */
  traverse(cb) {
    if (cb(this)) return true;

    for (let index = 0; index < this.children.length; index++) {
      const element = this.children[index];
      if (element.traverse(cb)) return true;
    }

    return false;
  }

  /**
   * Find a gameobject into the hierarchy with its uuid
   *
   * @param {string} uuid the uuid searched
   * @returns {GameObject} gameobject in the hierarchy with uuid
   */
  find(uuid) {
    let result = null;
    this.traverse(function (g) {
      if (g.getUUID() == uuid) {
        result = g;
        return true;
      }
      return false;
    });
    return result;
  }

  /**
   * Find a gameobject into the hierarchy with a name
   * return the first one encounter
   *
   * @param {string} name
   * @returns
   */
  findByName(name) {
    let result = null;
    this.traverse(function (g) {
      if (g.getName() == name) {
        result = g;
        return true;
      }
      return false;
    });
    return result;
  }

  /**
   * Add a child gameobject to this
   *
   * @param {GameObject} child
   */
  addChild(child) {
    for (let index = 0; index < this.children.length; index++) {
      const element = this.children[index];
      if (element.getUUID() == child.getUUID()) {
        console.log('already add ', child);
        return;
      }
    }

    this.children.push(child);
    child.setParent(this);
  }

  /**
   *
   * @param {GameObject} parent
   */
  setParent(parent) {
    this.parent = parent;

    if (parent) {
      this.parentUUID = parent.getUUID();
    }
  }

  getParent() {
    return this.parent;
  }

  /**
   *
   * @returns {string}
   */
  getParentUUID() {
    return this.parentUUID;
  }

  /**
   *
   * @returns {Array[GameObject]}
   */
  getChildren() {
    return this.children;
  }

  getComponents() {
    return this.components;
  }

  /**
   *
   * @param {string} type
   * @returns {GameObject/Components}
   */
  getComponent(type) {
    return this.components[type];
  }

  /**
   *
   * @param {string} type
   * @param {GameObject/Components} c
   */
  setComponent(type, c) {
    this.components[type] = c;
  }

  /**
   *
   * @returns {string}
   */
  getUUID() {
    return this.uuid;
  }

  /**
   *
   * @returns {THREE.Vector3}
   */
  getRotation() {
    return this.object3D.rotation;
  }

  /**
   * Set rotation and clamp it
   *
   * @param {THREE.Vector3} vector
   */
  setRotation(vector) {
    if (this.freeze) return;

    this.object3D.rotation.set(vector.x, vector.y, vector.z);
    this.clampRotation();
  }

  /**
   *
   * @param {THREE.Vector3} vector
   */
  setPosition(vector) {
    if (this.freeze) return;

    this.object3D.position.set(vector.x, vector.y, vector.z);
  }

  /**
   *
   * @returns {THREE.Vector3}
   */
  getPosition() {
    return this.object3D.position;
  }

  /**
   *
   * @param {THREE.Vector3} vector
   */
  setScale(vector) {
    if (this.freeze) return;

    this.object3D.scale.set(vector.x, vector.y, vector.z);
  }

  /**
   *
   * @returns {THREE.Vector3}
   */
  getScale() {
    return this.object3D.scale;
  }

  /**
   * If freeze components and transform are not updated
   *
   * @param {boolean} value
   */
  setFreeze(value) {
    this.freeze = value;
  }

  /**
   *
   * @returns {boolean}
   */
  getFreeze() {
    return this.freeze;
  }

  /**
   *
   * @returns {string}
   */
  getName() {
    return this.name;
  }

  /**
   *
   * @param {string} name the new name of the gameobject
   */
  setName(name) {
    this.name = name;
  }

  /**
   *
   * @returns {boolean}
   */
  hasNoLocalUpdate() {
    return this.noLocalUpdate;
  }

  /**
   * Compute this to JSON with or without its server side components
   *
   * @param {boolean} withWorldComponent
   * @returns {JSON} the json of this
   */
  toJSON(withWorldComponent = false) {
    const children = [];
    this.children.forEach((child) => {
      children.push(child.toJSON(withWorldComponent));
    });

    const componentModels = {};
    for (const type in this.components) {
      const c = this.components[type];
      if (!c.getModel().isWorldComponent() || withWorldComponent) {
        componentModels[type] = c.getModel().toJSON();
      }
    }

    // Add forced serialize component model
    for (
      let index = 0;
      index < this.forceSerializeComponentModels.length;
      index++
    ) {
      const type = this.forceSerializeComponentModels[index];
      const c = this.components[type];
      componentModels[type] = c.getModel().toJSON();
    }

    return {
      name: this.name,
      type: GameObject.TYPE,
      static: this.static,
      outdated: this.outdated,
      uuid: this.uuid,
      parentUUID: this.parentUUID,
      forceSerializeComponentModels: this.forceSerializeComponentModels,
      componentModels: componentModels,
      children: children,
      transform: {
        position: this.object3D.position.toArray(),
        rotation: this.object3D.rotation.toArray(),
        scale: this.object3D.scale.toArray(),
      },
      noLocalUpdate: this.noLocalUpdate,
      freeze: this.freeze,
    };
  }
};

GameObject.TYPE = 'GameObject';

/**
 * Lerp transform of g1 to g2 with a given ratio
 *
 * @param {GameObject} g1 first gameobject
 * @param {GameObject} g2 sencond
 * @param {number} ratio a number between 0 => 1
 * @returns {GameObject} g1 interpolated
 */
GameObject.interpolateInPlace = function (g1, g2, ratio) {
  g1.object3D.position.lerp(g2.object3D.position, ratio);
  g1.object3D.scale.lerp(g2.object3D.scale, ratio);
  g1.object3D.quaternion.slerp(g2.object3D.quaternion, ratio);
  return g1;
};

/**
 * Return a deep copy (new uuid are generated) of a gameObject
 *
 * @param {GameObject} gameObject
 * @returns {GameObject} a new gameobject with new uuid base on gameObject
 */
GameObject.deepCopy = function (gameObject) {
  const cloneJSON = gameObject.toJSON(true);
  // Rename uuid
  JSONUtils.parse(cloneJSON, function (json, key) {
    const keyLowerCase = key.toLowerCase();
    if (keyLowerCase === 'uuid') json[key] = THREE.MathUtils.generateUUID();

    if (keyLowerCase === 'name') {
      json[key] = json[key] + ' (clone)';
    }
  });
  return new GameObject(cloneJSON);
};

/**
 * Search in the object3D the object3D sign with uuid
 *
 * @param {string} uuid the uuid of the gameobject
 * @param {THREE.Object3D} obj the 3Dobject where to search
 * @param {boolean} upSearch true up search false bottom search
 * @returns {THREE.Object3D} the object3D sign with the uuid of the gameobject
 */
GameObject.findObject3D = function (uuid, obj, upSearch = true) {
  let result;
  if (upSearch) {
    let current = obj;
    while (current) {
      if (current.userData.gameObjectUUID == uuid) {
        result = current;
        break;
      }

      current = current.parent;
    }
  } else {
    obj.traverse(function (child) {
      if (child.userData.gameObjectUUID == uuid) {
        result = child;
      }
    });
  }

  return result;
};

// module.exports = {
//   GameObject: GameObject,
//   WorldScript: WorldScript,
//   Render: Render,
//   BrowserScript: BrowserScript,
//   Collider: Collider,
//   Audio: Audio,
// };

const Object3D = class extends THREE.Object3D {
  constructor(json) {
    super();

    Object3D.parseJSON(json);

    if (json.object.uuid != undefined) this.uuid = json.object.uuid;

    this.name = json.object.name || '';

    this.static = json.object.static || false;

    this.outdated = json.object.outdated || false;

    this.forceUpdate = true;
    if (json.object.forceUpdate != undefined) {
      this.forceUpdate = json.object.forceUpdate;
    }

    // List to force certain component to be serialize
    this.forceToJSONComponent = json.object.forceToJSONComponent || [];

    /** @type {object} */
    this.components = {};
    this.updateComponentFromJSON(json.object.components);
    this.updateMatrixFromJSON(json.object.matrix);

    if (json.object.children && json.object.children.length > 0) {
      json.object.children.forEach((childJSON) => {
        // THRRE Object3D toJSON dont have same structure for children
        this.add(new Object3D({ object: childJSON }));
      });
    }
  }

  updateMatrixFromJSON(jsonMatrix) {
    if (!jsonMatrix) return;
    this.matrix.fromArray(jsonMatrix);
  }

  /**
   * when using this function components should not have controllers
   * @param {*} json
   */
  updatefromJSON(json) {
    Object3D.parseJSON(json);

    this.components = {}; // Clear
    this.updateComponentFromJSON(json.components);
    this.updateMatrixFromJSON(json.matrix);
    this.name = json.name;
    this.static = json.static;
    this.outdated = json.outdated;

    this.children.forEach(function (child) {
      let jsonChild;
      for (let i = 0; i < json.children.length; i++) {
        if (json.children[i].uuid == child.uuid) {
          jsonChild = json.children[i];
          break;
        }
      }
      if (!jsonChild) {
        // C no longer in scene
        return;
      }

      child.updatefromJSON(jsonChild);
    });
  }

  updateComponentFromJSON(componentsJSON) {
    if (!componentsJSON) {
      return;
    }

    for (const type in componentsJSON) {
      const componentModelJSON = componentsJSON[type];

      switch (type) {
        // case Render.Model.TYPE:
        //   if (_this.components[Render.Model.TYPE])
        //     console.warn('multiple component');

        //   _this.components[Render.Model.TYPE] = new Component(
        //     new Render.Model(componentModelJSON)
        //   );

        //   break;
        // case Audio.Model.TYPE:
        //   if (_this.components[Audio.Model.TYPE])
        //     console.warn('multiple component');

        //   _this.components[Audio.Model.TYPE] = new Component(
        //     new Audio.Model(componentModelJSON)
        //   );

        //   break;
        case Script.Component.TYPE:
          if (this.components[Script.Component.TYPE])
            console.warn('multiple component');

          this.components[Script.Component.TYPE] = new Script.Component(
            new Script.Model(componentModelJSON)
          );

          break;
        // case BrowserScript.Model.TYPE:
        //   if (_this.components[BrowserScript.Model.TYPE])
        //     console.warn('multiple component');

        //   _this.components[BrowserScript.Model.TYPE] = new Component(
        //     new BrowserScript.Model(componentModelJSON)
        //   );

        //   break;
        case Collider.Component.TYPE:
          if (this.components[Collider.Component.TYPE])
            console.warn('multiple component');

          this.components[Collider.Component.TYPE] = new Collider.Component(
            new Collider.Model(componentModelJSON)
          );

          break;
        default:
          console.warn('wrong type component', type, componentModelJSON);
      }
    }
  }

  setOutdated(value) {
    this.outdated = value;
  }

  isOutdated() {
    return this.outdated;
  }

  isStatic() {
    return this.static;
  }

  getComponents() {
    return this.components;
  }

  /**
   *
   * @param {string} type
   * @returns {Base}
   */
  getComponent(type) {
    return this.components[type];
  }

  clone() {
    return new Object3D(this.toJSON());
  }

  toJSON(full = true) {
    const result = super.toJSON();

    // override metadata to know this is method which compute the JSON
    result.metadata.version = packageJSON.version;
    result.metadata.packageName = packageJSON.name;

    // add custom attributes
    result.object.static = this.static;
    result.object.outdated = this.outdated;
    result.object.forceUpdate = this.forceUpdate;
    if (this.parent) {
      result.object.parentUUID = this.parent.uuid;
    }

    if (result.object.uuid != this.uuid) throw new Error('wrong uuid');

    // add components
    const components = {};
    for (const type in this.components) {
      const c = this.components[type];

      if (!full && c.getController()) {
        continue;
      }

      components[type] = c.getModel().toJSON();
    }

    // Add forced serialize component model
    result.object.forceToJSONComponent = this.forceToJSONComponent;
    for (let index = 0; index < this.forceToJSONComponent.length; index++) {
      const type = this.forceToJSONComponent[index];
      const c = this.components[type];
      components[type] = c.getModel().toJSON();
    }

    result.components = components;

    return result;
  }
};

Object3D.parseJSON = function (json) {
  if (!json || !json.object) {
    console.error(json);
    throw new Error('wrong formated data json');
  }
};

module.exports = Object3D;