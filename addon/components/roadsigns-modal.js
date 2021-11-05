import { action } from '@ember/object';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';
import fetchRoadsignsData, { fetchSigns } from '../utils/fetchData';

export default class RoadsignRegulationCard extends Component {
  @tracked typeOptions = [
    {
      label: 'Road Sign',
      value: 'https://data.vlaanderen.be/ns/mobiliteit#Wegmarkeringconcept',
    },
    {
      label: 'Traffic Ligth',
      value: 'https://data.vlaanderen.be/ns/mobiliteit#Verkeerslichtconcept',
    },
    {
      label: 'Traffic Sign',
      value: 'https://data.vlaanderen.be/ns/mobiliteit#Verkeersbordconcept',
    },
  ];
  @tracked typeSelected;

  @tracked categoryOptions = [];
  @tracked categorySelected;

  @tracked codeFilter = '';
  @tracked descriptionFilter = '';

  @tracked tableData = [];

  constructor() {
    super(...arguments);
    this.fetchData.perform();
  }

  @action
  selectType(value) {
    this.typeSelected = value;
    this.refetchSigns.perform();
  }

  @action
  changeCode(e) {
    this.codeFilter = e.target.value;
    this.refetchSigns.perform();
  }

  @action
  changeDescription(e) {
    this.descriptionFilter = e.target.value;
    this.refetchSigns.perform();
  }

  @action
  selectCategory(value) {
    this.categorySelected = value;
    this.refetchSigns.perform();
  }

  @task
  *fetchData() {
    const { signs, classifications } = yield fetchRoadsignsData();
    this.tableData = signs;
    this.categoryOptions = classifications;
  }

  @task
  *refetchSigns() {
    const signs = yield fetchSigns(
      this.typeSelected ? this.typeSelected.value : undefined,
      this.codeFilter,
      this.descriptionFilter,
      this.categorySelected ? this.categorySelected.value : undefined
    );
    this.tableData = signs;
  }

  @action
  insertHtml(html) {
    console.log(html);
  }
}
