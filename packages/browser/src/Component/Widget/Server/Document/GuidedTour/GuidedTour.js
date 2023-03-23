import { findChildByID } from '../../../../HTMLUtil';
import { EventSender } from '@ud-viz/shared';

import './GuidedTour.css';

/**
 * Class: GuidedTour
 * Description :
 * The GuidedTour is an object handling the guidedtour view (should be rename GuidedTourView then)
 *
 *
 * @param { HTMLElement} guidedTourContainer The container of the guided tour
 * @param { import("./GuidedTourController").GuidedTourController } guidedTourController : instance of GuidedTourController
 *
//=============================================================================
 */
export class GuidedTour extends EventSender {
  constructor(guidedTourController) {
    super();

    this.rootHtml = document.createElement('div');
    this.rootHtml.innerHTML = this.innerContentHtml;

    this.guidedTourController = guidedTourController;

    this.tourIndex = 1; // Current guided tour. Default is 1 (start)

    this.stepIndex = 1; // Current step of the guidedtour. Defautt is 1 (start)

    // boolean to control the state of the guided tour window (open/closed)
    this.guidedTourWindowIsActive = true;

    this.isStart = true;

    this.currentTour = null; // Current guided tour
    this.currentStep = null; // Current step of the current guided tour

    // instance of document browser
    this.documentBrowser = this.guidedTourController.browser;

    // Update browser view
    const guidedTourText2 = document.createElement('div');
    guidedTourText2.id = 'guidedTourText2';
    // findChildByID(this.rootHtml,'docBrowserWindow').appendChild(guidedTourText2);

    this.initializeButtons();
    this.startGuidedTourMode();
  }

  html() {
    return this.rootHtml;
  }

  dispose() {
    this.rootHtml.remove();
  }

  get innerContentHtml() {
    return `
    <div id="guidedTourWindow">
    <div id="guidedTourTitle"></div>
    <div id="guidedTourStepTitle"></div>
    <div id="guidedTourText1"></div>
    <div id="guidedTourDocPreview"><img id="guidedTourDocPreviewImg"/></div>
    <div id="tourCpt"></div>
    <button id="guidedTourNextStepButton" type=button>⇨</button>
    <button id="guidedTourNextTourButton" type=button>⇨</button>
    <button id="guidedTourPreviousStepButton" type=button>⇦</button>
    <button id="guidedTourPreviousTourButton" type=button>⇦</button>
    <button id="guidedTourExitButton" type=button>EXIT</button>
    <button id="guidedTourStartButton" type=button>START</button>
    </div>
    `;
  }

  /**
   * Hide or show the guided tour window
   */
  toggleGuidedTourWindow() {
    findChildByID(this.rootHtml, 'guidedTourWindow').style.display = this
      .guidedTourWindowIsActive
      ? 'block'
      : 'none';
    this.guidedTourWindowIsActive = !this.guidedTourWindowIsActive;

    if (this.isStart) {
      this.startGuidedTourMode();
      this.isStart = false;
      this.guidedTourController.toggleGuidedTourButtons(true);
    }
  }

  /**
   * Get all available guided tour from the database
   */
  startGuidedTourMode() {
    this.guidedTourController.getGuidedTours().then(() => {
      this.previewTour();
    });
  }

  /**
   * Initialize the preview of the guided tour
   */
  previewTour() {
    findChildByID(this.rootHtml, 'tourCpt').innerHTML =
      'Tour: ' +
      this.tourIndex +
      ' out of ' +
      this.guidedTourController.guidedTours.length;
    findChildByID(this.rootHtml, 'guidedTourPreviousTourButton').style.display =
      'block';
    findChildByID(this.rootHtml, 'guidedTourNextTourButton').style.display =
      'block';
    // For the demo, until we have more than one finished guided tour
    // we can prevent user from changing tour by hiding the buttons
    if (this.guidedTourController.preventUserFromChangingTour) {
      findChildByID(
        this.rootHtml,
        'guidedTourPreviousTourButton'
      ).style.display = 'none';
      findChildByID(this.rootHtml, 'guidedTourNextTourButton').style.display =
        'none';
    }

    findChildByID(this.rootHtml, 'guidedTourPreviousStepButton').style.display =
      'none';
    findChildByID(this.rootHtml, 'guidedTourNextStepButton').style.display =
      'none';
    findChildByID(this.rootHtml, 'guidedTourExitButton').style.display = 'none';
    // findChildByID(this.rootHtml,"guidedTourText2").style.display = "none";
    findChildByID(this.rootHtml, 'guidedTourStartButton').style.display =
      'block';

    const currentTour = this.guidedTourController.getCurrentTour();
    findChildByID(this.rootHtml, 'guidedTourTitle').innerHTML = currentTour
      ? currentTour.name
      : 'No guided tour';
    findChildByID(this.rootHtml, 'guidedTourText1').innerHTML = currentTour
      ? currentTour.description
      : 'Please add guided tours';
    findChildByID(this.rootHtml, 'guidedTourText1').style.height = '45%';
    findChildByID(this.rootHtml, 'guidedTourStepTitle').innerHTML = null;
  }

  /**
   * Update step with current step data
   */
  updateStep() {
    this.currentStep = this.guidedTourController.getCurrentStep();
    this.documentBrowser.currentMetadata =
      this.guidedTourController.getCurrentStep().document;
    this.documentBrowser.currentDoc =
      this.guidedTourController.getCurrentStep().document;
    this.documentBrowser.updateBrowser();
    findChildByID(this.rootHtml, 'guidedTourText1').innerHTML =
      this.currentStep.text1;
    findChildByID(this.rootHtml, 'guidedTourStepTitle').innerHTML =
      this.currentStep.title;
    this.documentBrowser.focusOnDoc();
  }

  /**
   * Start guided tour
   */
  startGuidedTour() {
    const currentTour = this.guidedTourController.getCurrentTour();

    if (currentTour && currentTour.extendedDocs.length > 0) {
      this.tourIndex = 1;
      this.stepIndex = 1;
      this.updateStep();
      // Setup the display (hide & show elements)
      this.guidedTourController.toggleGuidedTourButtons(false);
      findChildByID(this.rootHtml, 'guidedTourDocPreviewImg').style.display =
        'none';
      findChildByID(this.rootHtml, 'guidedTourText1').style.height = '60%';
      findChildByID(this.rootHtml, 'tourCpt').style.display = 'none';
    } else {
      alert('This guided tour is empty'); // Should never happen. If a guided tour
      // doesn't have steps, then it is not a guided tour
    }
  }

  /**
   * Quit current guided tour
   */
  exitGuidedTour() {
    this.guidedTourController.reset();
  }

  /**
   * Update guided tour preview by clicking on "guidedTourNextTourButton" button
   */
  nextTour() {
    if (this.tourIndex < this.guidedTourController.guidedTours.length) {
      this.guidedTourController.getNextTour();
      this.tourIndex++;
      this.previewTour();
    }
  }

  /**
   * Update guided tour preview by clicking on "guidedTourPreviousTourButton" button
   */
  previousTour() {
    this.guidedTourController.getPreviousTour();
    if (this.tourIndex > 1) {
      this.tourIndex--;
    }
    this.previewTour();
  }

  /**
   * Update step by clicking on "guidedTourNextStepButton" button
   */
  nextStep() {
    if (
      this.stepIndex <
      this.guidedTourController.getCurrentTour().extendedDocs.length
    ) {
      this.stepIndex++;
      this.guidedTourController.getNextStep();
      this.updateStep();
    }
  }

  /**
   * Update step by clicking on "guidedTourPreviousStepButton" button
   */
  previousStep() {
    if (this.stepIndex > 1) {
      this.guidedTourController.getPreviousStep();
      this.stepIndex--;
      this.updateStep();
    }
  }

  /**
   *  Event listeners (buttons)
   */
  initializeButtons() {
    findChildByID(this.rootHtml, 'guidedTourNextTourButton').addEventListener(
      'mousedown',
      this.nextTour.bind(this),
      false
    );
    findChildByID(
      this.rootHtml,
      'guidedTourPreviousTourButton'
    ).addEventListener('mousedown', this.previousTour.bind(this), false);
    findChildByID(this.rootHtml, 'guidedTourStartButton').addEventListener(
      'mousedown',
      this.startGuidedTour.bind(this),
      false
    );
    findChildByID(this.rootHtml, 'guidedTourNextStepButton').addEventListener(
      'mousedown',
      this.nextStep.bind(this),
      false
    );
    findChildByID(
      this.rootHtml,
      'guidedTourPreviousStepButton'
    ).addEventListener('mousedown', this.previousStep.bind(this), false);
    findChildByID(this.rootHtml, 'guidedTourExitButton').addEventListener(
      'mousedown',
      this.exitGuidedTour.bind(this),
      false
    );
  }
}