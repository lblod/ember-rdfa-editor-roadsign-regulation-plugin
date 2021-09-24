import { action } from '@ember/object';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';

export default class RoadsignsTable extends Component {
  @tracked selected;

  @action
  selectRow(id) {
    if (this.selected === id) {
      this.selected = undefined;
    } else {
      this.selected = id;
    }
  }
}
