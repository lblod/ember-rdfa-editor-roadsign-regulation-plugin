/**
 * Entry point for RoadsignRegulation
 *
 * @module editor-roadsign-regulation-plugin
 * @class RoadSignRegulationPlugin
 * @constructor
 * @extends EmberService
 */
export default class RoadSignRegulationPlugin {
  /**
   * Handles the incoming events from the editor dispatcher.  Responsible for generating hint cards.
   *
   * @method execute
   *
   * @param {string} hrId Unique identifier of the state in the HintsRegistry.  Allows the
   * HintsRegistry to update absolute selected regions based on what a user has entered in between.
   * @param {Array} rdfaBlocks Set of logical blobs of content which may have changed.  Each blob is
   * either has a different semantic meaning, or is logically separated (eg: a separate list item).
   * @param {Object} hintsRegistry Keeps track of where hints are positioned in the editor.
   * @param {Object} editor Your public interface through which you can alter the document.
   *
   * @public
   */
  controller;

  get name() {
    return 'roadsign-regulation';
  }

  initialize(controller) {
    this.controller = controller;
    controller.registerWidget({
      componentName: 'editor-plugins/roadsign-regulation-card',
      identifier: 'roadsign-regulation-plugin/card',
      desiredLocation: 'sidebar',
    });
    controller.onEvent('modelWritten', this.modelWrittenHandler);
  }

  modelWrittenHandler(event) {
    if (event.owner !== this.name) {
      const rangesToHighlight = this.controller.executeCommand(
        'match-text',
        this.controller.createFullDocumentRange(),
        /roadsign/g
      );

      for (const range of rangesToHighlight) {
        const selection = this.controller.createSelection();
        selection.selectRange(range);
        this.controller.executeCommand('make-highlight', selection, false);
      }
    }
  }
}
