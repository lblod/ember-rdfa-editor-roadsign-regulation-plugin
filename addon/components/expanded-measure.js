import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

import {
  ZONAL_URI,
  POTENTIALLY_ZONAL_URI,
  NON_ZONAL_URI,
} from '../utils/constants';

export default class ExpandedMeasureComponent extends Component {
  @tracked zonalityValue;
  @tracked temporalValue;
  ZONAL_URI = ZONAL_URI;
  NON_ZONAL_URI = NON_ZONAL_URI;
  get isPotentiallyZonal() {
    return this.args.measure.zonality === POTENTIALLY_ZONAL_URI;
  }
  get insertButtonDisabled() {
    return this.isPotentiallyZonal && !this.zonalityValue;
  }

  @action
  changeZonality(e) {
    this.zonalityValue = e.target.value;
  }
  @action
  changeTemporality(e) {
    this.temporalValue = e.target.value;
  }
  @action
  insert() {
    this.args.insert(this.args.measure, this.zonalityValue, this.temporalValue);
  }
  @action
  unselectRow() {
    this.args.selectRow(this.args.measure.uri);
  }
}
