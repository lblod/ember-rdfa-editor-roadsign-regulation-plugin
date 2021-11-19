import { action } from '@ember/object';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { getOwner } from '@ember/application';

export default class RoadsignsTable extends Component {
  @tracked selected;
  imageBaseUrl;

  constructor() {
    super(...arguments);
    const config = getOwner(this).resolveRegistration('config:environment');
    this.imageBaseUrl = config.roadsignRegulationPlugin.imageBaseUrl;
  }

  @action
  selectRow(id) {
    if (this.selected === id) {
      this.selected = undefined;
    } else {
      this.selected = id;
    }
  }
  @action
  insert(row) {
    this.args.insert.perform(row);
  }
}
