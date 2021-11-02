import { action } from '@ember/object';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';
import fetchRoadsignsData from '../utils/fetchData';

export default class RoadsignRegulationCard extends Component {
  @tracked typeOptions = ['Road Sign', 'Traffic Ligth', 'Traffic Sign'];
  @tracked typeSelected = '';

  @tracked categoryOptions = [];
  @tracked categorySelected = '';

  @tracked tableData = [];

  constructor() {
    super(...arguments);
    this.fetchData.perform();
  }

  @action
  selectType(value) {
    this.typeSelected = value;
  }

  @action
  selectCategory(value) {
    this.categorySelected = value;
  }

  @task
  *fetchData() {
    const { signs, classifications } = yield fetchRoadsignsData();
    console.log(classifications)
    this.tableData = signs;
    this.categoryOptions = classifications;

  }
}
