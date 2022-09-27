/**
 * Entrypoint for the roadsign regulation plugin.
 */
export default class RoadSignRegulationPlugin {
  controller;

  get name() {
    return 'roadsign-regulation';
  }

  /**
   * Gets called when the editor loads.
   * Can optionally be async if needed.
   * @param controller
   */
  initialize(controller) {
    this.controller = controller;
    controller.registerWidget({
      componentName: 'editor-plugins/roadsign-regulation-card',
      identifier: 'roadsign-regulation-plugin/card',
      desiredLocation: 'insertSidebar',
    });
  }
}
