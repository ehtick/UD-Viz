const StateDiff = require('./StateDiff');
const Object3D = require('./Object3D/Object3D');
const JSONUtils = require('../Components/JSONUtils');

/**
 * Store the state of the  at a given time
 */
const State = class {
  constructor(json) {
    if (!json) throw new Error('no json');

    // Gameobjects
    this.object3D = new Object3D(json.object3DJSON);

    // Timestamp
    this.timestamp = json.timestamp || -1;

    // Flag to determine if that state has been consumed/treated by the gameview (or something else)
    this._consumed = false;
  }

  setConsumed(value) {
    this._consumed = value;
  }

  hasBeenConsumed() {
    return this._consumed;
  }

  /**
   * Compute the next state with a given StateDiff
   *
   * @param {StateDiff} diff the StateDiff between two State
   * @returns {State} the new State
   */
  add(diff) {
    const objectsUUID = diff.getObjectsUUID();
    const objects3DToUpdateJSON = diff.getObjects3DToUpdateJSON();

    const cloneObject3D = this.object3D.clone();
    cloneObject3D.traverse(function (child) {
      const uuid = child.uuid;

      if (!objectsUUID.includes(uuid)) {
        // Remove object not in diff
        child.removeFromParent();
      } else {
        // Update the one which needs update
        const object3DJSON = objects3DToUpdateJSON[uuid];
        if (object3DJSON) {
          // Update
          child.updatefromJSON(object3DJSON);
          delete objects3DToUpdateJSON[uuid]; // Remove it
        } else {
          // G is not outdated
          child.setOutdated(false); //maybe useless?
        }
      }
    });

    // Create others which have been added
    for (const uuid in objects3DToUpdateJSON) {
      const json = objects3DToUpdateJSON[uuid];
      const newObject3D = new Object3D(json, null);
      console.log('parent', json.parentUUID);
      console.log('gloabl', cloneObject3D.toJSON());
      const parent = cloneObject3D.getObjectByProperty('uuid', json.parentUUID);
      parent.add(newObject3D);
    }

    // DEBUG process.DEV_MODE ?
    let count = 0;
    cloneObject3D.traverse(function (child) {
      if (objectsUUID.includes(child.uuid)) count++;
    });
    if (objectsUUID.length != count) {
      throw new Error('count of go error');
    }

    return new State({
      object3DJSON: cloneObject3D.toJSON(),
      timestamp: diff.getTimeStamp(),
    });
  }

  /**
   * Check if there is gameobject with a given uuid
   *
   * @param {string} uuid uuid to be check
   * @returns {boolean} true if there is a gameobject with this uuid, false otherwise
   */
  includes(uuid) {
    if (this.object3D.getObjectByProperty('uuid', uuid)) {
      return true;
    }
    return false;
  }

  /**
   * Compute the StateDiff between this and the state passed
   *
   * @param {State} state the state passed to compute the StateDiff with this
   * @returns {StateDiff} the difference between this and state
   */
  toDiff(previousState) {
    const objectsUUID = [];
    const objects3DToUpdateJSON = {};
    const alreadyInObjects3DToUpdateJSON = [];
    this.object3D.traverse((child) => {
      objectsUUID.push(child.uuid); // Register all uuid
      if (!alreadyInObjects3DToUpdateJSON.includes(child.uuid)) {
        // Not present in outdatedObjectsJSON
        if (!previousState.includes(child.uuid) || child.isOutdated()) {
          // If not in the last state or outdated
          objects3DToUpdateJSON[child.uuid] = child.toJSON();
          // Avoid to add child of an outdated object twice because toJSON is recursive
          child.traverse(function (childAlreadyInObjects3DToUpdateJSON) {
            alreadyInObjects3DToUpdateJSON.push(
              childAlreadyInObjects3DToUpdateJSON.uuid
            );
          });
        }
      }
    });

    return new StateDiff({
      objectsUUID: objectsUUID,
      objects3DToUpdateJSON: objects3DToUpdateJSON,
      timestamp: this.timestamp,
    });
  }

  log() {
    this.object3D.traverse((child) => {
      console.log('\x1b[41m', child.name);
      console.log('\x1b[42m', child.toJSON());
    });
  }

  equals(state) {
    return JSONUtils.equals(this.toJSON(), state.toJSON());
  }

  /**
   * Return a clone of this
   *
   * @returns {State}
   */
  clone() {
    return new State(this.toJSON(true));
  }

  /**
   *
   * @returns {number}
   */
  getTimestamp() {
    return this.timestamp;
  }

  /**
   *
   * @returns {GameObject}
   */
  getObject3D() {
    return this.object3D;
  }

  /**
   * Compute this to JSON
   *
   * @returns {JSON}
   */
  toJSON() {
    return {
      type: State.TYPE,
      object3DJSON: this.object3D.toJSON(true),
      timestamp: this.timestamp,
    };
  }
};

State.TYPE = 'State';

// //STATIC

/**
 * Compute the state between w1 and w2, interpolating with a given ratio
 *
 * @param {State} w1 first state if ratio = 0, result = w1
 * @param {State} w2 second state if ratio = 1, result = w2
 * @param {number} ratio a number between 0 => 1
 * @returns {State} the interpolated state
 */
State.interpolate = function (w1, w2, ratio) {
  if (!w2) return w1;

  // Interpolate go
  const mapW2 = {};
  w2.getGameObject().traverse(function (go) {
    mapW2[go.getUUID()] = go;
  });
  const result = w1.clone();
  result.gameObject.traverse(function (go) {
    if (go.isStatic()) return false; // Do not stop propagation

    if (mapW2[go.getUUID()]) {
      GameObject.interpolateInPlace(go, mapW2[go.getUUID()], ratio);
    }
  });

  return result;
};

module.exports = State;