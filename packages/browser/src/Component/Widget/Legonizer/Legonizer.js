/** @format */

// Components
import { Window } from '../Components/GUI/js/Window';
import { checkParentChild } from '../../Components/Components';
import * as THREE from 'three';
import * as itowns from 'itowns';
// Import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { MAIN_LOOP_EVENTS } from 'itowns';
import './../About/About.css';

/**
 *
 *
 */
export class LegonizerWindow extends Window {
  constructor(view3D) {
    super('legonizer', 'Legonizer', false);

    this.view3D = view3D;

    this.boxSelector;

    this.transformCtrls;

    this.selection = true;
  }

  get innerContentHtml() {
    return `
    <div id="${this.paramLegonizerId}">
      <div class="box-section" id="${this.coordBoxSectionId}"> 
        <label for="color-layers-spoiler" class="section-title">Coordinates</Label>
      </div>
      <div class="box-section" id="${this.scaleSectionId}"> 
        <label for="elevation-layers-spoiler" class="section-title">Scales parameters</Label>
      </div>
    </div>`;
  }

  innerContentCoordinates() {
    const inputVector = document.createElement('div');
    inputVector.id = 'Coordinates' + '_inputVector';
    inputVector.style.display = 'inline-flex';

    const coordinatesString = ['x', 'y', 'z'];

    for (let i = 0; i < 3; i++) {
      // Coord Elements
      const coordElement = document.createElement('div');
      coordElement.id = coordinatesString[i] + '_grid';
      coordElement.style.display = 'grid';
      coordElement.style.width = '100%';
      coordElement.style.height = 'auto';

      // Label
      const labelElement = document.createElement('h3');
      labelElement.textContent = coordinatesString[i];

      // Input
      const inputElement = document.createElement('input');
      inputElement.id = 'input_' + coordinatesString[i];
      inputElement.type = 'number';
      inputElement.style.width = 'inherit';
      inputElement.setAttribute('value', '0');

      coordElement.appendChild(labelElement);
      coordElement.appendChild(inputElement);

      inputVector.appendChild(coordElement);
    }

    this.coordBoxElement.appendChild(inputVector);

    // Button Select an area
    const buttonSelectionAreaElement = document.createElement('button');
    buttonSelectionAreaElement.id = 'button_selection';
    buttonSelectionAreaElement.textContent = 'Select an area';

    buttonSelectionAreaElement.onclick = () => {
      this.selectArea();
    };

    this.coordBoxElement.appendChild(buttonSelectionAreaElement);

    // Button Generate Lego Mockup
    const buttonGenerateMockupElement = document.createElement('button');
    buttonGenerateMockupElement.id = 'button_generate_Mockup';
    buttonGenerateMockupElement.textContent = 'Generate Lego Mockup';

    buttonGenerateMockupElement.addEventListener('click', this.generateMockup);

    this.parametersElement.appendChild(buttonGenerateMockupElement);
  }

  innerContentScale() {
    const inputVector = document.createElement('div');
    inputVector.id = 'lego' + '_inputVector';
    inputVector.style.display = 'inline-flex';

    const coordinatesString = ['x count lego plate', 'y count lego plate'];

    for (let i = 0; i < 2; i++) {
      // //coord Elements
      const scaleElement = document.createElement('div');
      scaleElement.id = coordinatesString[i] + '_grid';
      scaleElement.style.display = 'grid';
      scaleElement.style.width = '50%';
      scaleElement.style.height = 'auto';

      // Label
      const labelElement = document.createElement('h3');
      labelElement.textContent = coordinatesString[i];

      // Input
      const inputElement = document.createElement('input');
      inputElement.id = 'input' + coordinatesString[i];
      inputElement.type = 'number';
      inputElement.style.width = 'inherit';
      inputElement.setAttribute('value', '0');

      scaleElement.appendChild(labelElement);
      scaleElement.appendChild(inputElement);

      inputVector.appendChild(scaleElement);
    }

    this.scaleBoxElement.appendChild(inputVector);
  }

  windowCreated() {
    if (!this.boxSelector) {
      const geometry = new THREE.BoxGeometry(200, 200, 200);
      const object = new THREE.Mesh(
        geometry,
        new THREE.MeshLambertMaterial({ color: 0x00ff00 })
      );

      object.position.x = this.view3D.extent.center().x;
      object.position.y = this.view3D.extent.center().y;
      object.position.z = 200;

      object.updateMatrixWorld();

      // Box selector
      this.boxSelector = object;
      this.view3D.getScene().add(object);

      this.transformCtrls = new TransformControls(
        this.view3D.getCamera(),
        this.view3D.getItownsView().mainLoop.gfxEngine.label2dRenderer.domElement
      );

      // Update view when the box selector is changed
      this.transformCtrls.addEventListener('change', () => {
        this.view3D.getItownsView().controls.dispose();
        this.view3D.getItownsView().notifyChange(this.view3D.getCamera());
        this.transformCtrls.updateMatrixWorld();
      });

      this.view3D.getScene().add(this.transformCtrls);
    }
    this.view3D.getItownsView().controls.enableRotation = false;

    this.boxSelector.visible = true;
    // HTML content
    this.innerContentCoordinates();
    this.innerContentScale();

    this.transformCtrls.visible = true;
    this.transformCtrls.attach(this.boxSelector);
    this.transformCtrls.updateMatrixWorld();

    // Request update every active frame
    this.view3D
      .getItownsView()
      .addFrameRequester(MAIN_LOOP_EVENTS.AFTER_CAMERA_UPDATE, () =>
        this._updateFieldsFromBoxSelector()
      );

    // RECALCULER LES CONTROLS
    const planarControl = new itowns.PlanarControls(
      this.view3D.getItownsView(),
      {
        handleCollision: false,
        focusOnMouseOver: false,
        focusOnMouseClick: false,
      }
    );
    this.view3D.getItownsView().controls = planarControl;
    // Console.log(planarControl);
  }

  /**
   * Updates the form fields from the box selector position.
   */
  _updateFieldsFromBoxSelector() {
    if (this.isVisible) {
      const position = this.boxSelector.position;
      this.inputCoordXElement.value = position.x;
      this.inputCoordYElement.value = position.y;
      this.inputCoordZElement.value = position.z;
    }
  }

  windowDestroyed() {
    this.boxSelector.visible = false;
    this.transformCtrls.attach(this.boxSelector);
    this.transformCtrls.visible = false;
  }

  generateMockup() {
    // Create THREE js window with heightmap mesh
    const mockupWindow = new Window('MockupWindow', 'Mockup Window', true);
    mockupWindow.innerContentHtml = `<div id="lego_mockup_window">`;
    const mockupElement = mockupWindow.header;
    console.log(mockupElement);
    mockupElement.style.left = 'unset';
    mockupElement.style.right = '10px';
    mockupElement.style.top = '10px';
    mockupElement.style.height = 'auto';
    mockupElement.style.width = '30%';
    mockupElement.style.borderRadius = '15px';
  }

  // Select Area from 3DTiles
  selectArea() {
    if (this.selection) {
      // Remove itowns controls
      this.view3D.getItownsView().controls.dispose();

      this.buttonSelectionElement.textContent = 'Finish';
      const view3D = this.view3D;

      // Add listeners
      const manager = view3D.getInputManager();
      const rootWelGL = view3D.getRootWebGL();

      let isDragging = false;

      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({
        color: 0x0000ff,
        opacity: 0.3,
        transparent: true,
      });
      const selectAreaObject = new THREE.Mesh(geometry, material);
      selectAreaObject.name = 'Select Area Menu Object';

      // Compute z + height of the box
      let minZ, maxZ;

      const mouseCoordToWorldCoord = (event, result) => {
        view3D
          .getItownsView()
          .getPickingPositionFromDepth(
            new THREE.Vector2(event.offsetX, event.offsetY),
            result
          );

        // Compute minZ maxZ according where the mouse is moving TODO check with a step in all over the rect maybe
        minZ = Math.min(minZ, result.z);
        maxZ = Math.max(maxZ, result.z);
        selectAreaObject.position.z = (minZ + maxZ) * 0.5;
        selectAreaObject.scale.z = 50 + maxZ - minZ; // 50 higher to see it
      };

      const worldCoordStart = new THREE.Vector3();
      const worldCoordCurrent = new THREE.Vector3();
      const center = new THREE.Vector3();

      const updateSelectAreaObject = () => {
        center.lerpVectors(worldCoordStart, worldCoordCurrent, 0.5);

        // Place on the xy plane
        selectAreaObject.position.x = center.x;
        selectAreaObject.position.y = center.y;

        // Compute scale
        selectAreaObject.scale.x = worldCoordCurrent.x - worldCoordStart.x;
        selectAreaObject.scale.y = worldCoordCurrent.y - worldCoordStart.y;
      };

      const dragStart = (event) => {
        if (checkParentChild(event.target, view3D.ui)) return; // Ui has been clicked

        isDragging = true; // Reset
        minZ = Infinity; // Reset
        maxZ = -Infinity; // Reset

        mouseCoordToWorldCoord(event, worldCoordStart);
        mouseCoordToWorldCoord(event, worldCoordCurrent);

        updateSelectAreaObject();

        this.view3D.getScene().add(selectAreaObject);
      };
      manager.addMouseInput(rootWelGL, 'mousedown', dragStart);

      const dragging = (event) => {
        if (checkParentChild(event.target, view3D.ui) || !isDragging) return; // Ui

        mouseCoordToWorldCoord(event, worldCoordCurrent);
        updateSelectAreaObject();
      };
      manager.addMouseInput(rootWelGL, 'mousemove', dragging);

      const dragEnd = () => {
        if (!isDragging) return; // Was not dragging

        view3D.getScene().remove(selectAreaObject);
        isDragging = false;

        if (worldCoordStart.equals(worldCoordCurrent)) return; // It is not an area

        // edit conf go
        // const ws = this.localCtx.getWebSocketService();
        // const ImuvConstants = view3D.getLocalScriptModules()['ImuvConstants'];
        // const localScriptComp = this.go.getComponent(Game.LocalScript.TYPE);
        // ws.emit(ImuvConstants.WEBSOCKET.MSG_TYPES.EDIT_CONF_COMPONENT, {
        //   goUUID: this.go.getUUID(),
        //   componentUUID: localScriptComp.getUUID(),
        //   key: 'area',
        //   value: {
        //     start: worldCoordStart.toArray(),
        //     end: worldCoordCurrent.toArray(),
        //   },
        // });
      };
      manager.addMouseInput(rootWelGL, 'mouseup', dragEnd);

      // Record for further dispose
      // this.listeners.push(dragStart);
      // this.listeners.push(dragging);
      // this.listeners.push(dragEnd);

      this.selection = false;
    } else {
      this.buttonSelectionElement.textContent = 'Select an area';

      // RECALCULER LES CONTROLS
      const planarControl = new itowns.PlanarControls(
        this.view3D.getItownsView(),
        {
          handleCollision: false,
          focusOnMouseOver: false,
          focusOnMouseClick: false,
        }
      );
      this.view3D.getItownsView().controls = planarControl;

      this.selection = true;
    }
  }

  // //// GETTERS
  // /ID

  get coordBoxSectionId() {
    return `box_section_coordinates`;
  }

  get scaleSectionId() {
    return `box_section_scale`;
  }

  get paramLegonizerId() {
    return `div_parameters`;
  }

  get inputCoordinateXId() {
    return `input_x`;
  }

  get inputCoordinateYId() {
    return `input_y`;
  }

  get inputCoordinateZId() {
    return `input_z`;
  }

  get buttonSelectionId() {
    return `button_selection`;
  }

  get coordBoxElement() {
    return document.getElementById(this.coordBoxSectionId);
  }

  get parametersElement() {
    return document.getElementById(this.paramLegonizerId);
  }

  get scaleBoxElement() {
    return document.getElementById(this.scaleSectionId);
  }

  get inputCoordXElement() {
    return document.getElementById(this.inputCoordinateXId);
  }

  get inputCoordYElement() {
    return document.getElementById(this.inputCoordinateYId);
  }

  get inputCoordZElement() {
    return document.getElementById(this.inputCoordinateZId);
  }

  get buttonSelectionElement() {
    return document.getElementById(this.buttonSelectionId);
  }
}
