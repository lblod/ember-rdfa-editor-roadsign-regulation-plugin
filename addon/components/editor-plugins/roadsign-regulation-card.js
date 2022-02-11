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
const acceptedTypes = [
  '>https://data.vlaanderen.be/id/concept/BesluitType/4d8f678a-6fa4-4d5f-a2a1-80974e43bf34',
  '>https://data.vlaanderen.be/id/concept/BesluitType/7d95fd2e-3cc9-4a4c-a58e-0fbc408c2f9b',
  '>https://data.vlaanderen.be/id/concept/BesluitType/3bba9f10-faff-49a6-acaa-85af7f2199a3',
  '>https://data.vlaanderen.be/id/concept/BesluitType/0d1278af-b69e-4152-a418-ec5cfd1c7d0b',
  '>https://data.vlaanderen.be/id/concept/BesluitType/e8afe7c5-9640-4db8-8f74-3f023bec3241',
  '>https://data.vlaanderen.be/id/concept/BesluitType/256bd04a-b74b-4f2a-8f5d-14dda4765af9',
  '>https://data.vlaanderen.be/id/concept/BesluitType/67378dd0-5413-474b-8996-d992ef81637a',
];

export default class RoadsignRegulationCard extends Component {
  @tracked modalOpen;
  @tracked showCard = false;

  constructor() {
    super(...arguments);
    this.args.controller.onEvent('selectionChanged', this.selectionChanged);
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
      .match(null, 'a')
      .transformDataset((dataset, termConverter) => {
        return dataset.filter((quad) =>
          acceptedTypes
            .map((type) => termConverter(type).value)
            .includes(quad.object.value)
        );
      })
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
  selectionChanged() {
    const limitedDatastore = this.args.controller.datastore.limitToRange(
      this.args.controller.selection.lastRange,
      'rangeIsInside'
    );
    const besluit = limitedDatastore
      .match(null, 'a')
      .transformDataset((dataset, termConverter) => {
        return dataset.filter((quad) =>
          acceptedTypes
            .map((type) => termConverter(type).value)
            .includes(quad.object.value)
        );
      })
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
