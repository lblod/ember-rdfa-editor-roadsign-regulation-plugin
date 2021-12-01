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
  @tracked showCard = false;

  constructor() {
    super(...arguments);
    this.args.controller.onEvent('contentChanged', this.modelWrittenHandler);
  }

  @action
  toggleModal() {
    this.modalOpen = !this.modalOpen;
  }
  @action
  insert(html) {
    const limitedDatastore = this.args.controller.datastore.limitToRange(
      this.args.controller.selection.lastRange,
      'rangeIsInside'
    );
    const besluit = limitedDatastore
      .match(
        null,
        'a',
        '>https://data.vlaanderen.be/id/concept/BesluitType/67378dd0-5413-474b-8996-d992ef81637a'
      )
      .asSubjectNodes()
      .next().value;
    const besluitNode = [...besluit.nodes][0];
    let articleContainerNode;
    for (let child of besluitNode.children) {
      if (child.attributeMap.get('property') === 'prov:value') {
        articleContainerNode = child;
        break;
      }
    }
    const range = this.args.controller.rangeFactory.fromInNode(
      articleContainerNode,
      articleContainerNode.getMaxOffset(),
      articleContainerNode.getMaxOffset()
    );
    this.args.controller.executeCommand('insert-html', html, range);
  }

  @action
  modelWrittenHandler() {
    const limitedDatastore = this.args.controller.datastore.limitToRange(
      this.args.controller.selection.lastRange,
      'rangeIsInside'
    );
    const besluit = limitedDatastore
      .match(
        null,
        'a',
        '>https://data.vlaanderen.be/id/concept/BesluitType/67378dd0-5413-474b-8996-d992ef81637a'
      )
      .asQuads()
      .next().value;
    if (besluit) {
      this.showCard = true;
      this.besluitUri = besluit.subject.value;
    } else {
      this.showCard = false;
    }
  }
}
