import { action } from '@ember/object';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

/**
 * Card displaying a hint of the Date plugin
 *
 * @module editor-roadsign-regulation-plugin
 * @class RoadsignRegulationCard
 * @extends Ember.Component
 */
export default class RoadsignRegulationCard extends Component {
  @tracked modalOpen;

  @action
  toggleModal() {
    this.modalOpen = !this.modalOpen;
  }
  @action
  insert() {
    const info = this.args.info;
    info.hintsRegistry.removeHintsAtLocation(
      info.location,
      info.hrId,
      'roadsign-regulation-scope'
    );
    const mappedLocation = info.hintsRegistry.updateLocationToCurrentIndex(
      info.hrId,
      info.location
    );
    const selection = info.editor.selectHighlight(mappedLocation);
    info.editor.update(selection, {
      set: {
        innerHTML:
          'my <a href="https://say-editor.com">Say Editor</a> hint card',
      },
    });
  }
}
