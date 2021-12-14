import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

import { ZONAL_URI, POTENTIALLY_ZONAL_URI, NON_ZONAL_URI } from '../utils/constants';

export default class ExpandedMeasureComponent extends Component {
  @tracked zonalityValue;
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
  insert() {
    if (this.zonalityValue) {
      this.args.insert({ ...this.args.measure, zonality: this.zonalityValue });
    } else {
      this.args.insert(this.args.measure);
    }
  }
  @action
  unselectRow() {
    this.args.selectRow(this.args.measure.uri);
  }
}
