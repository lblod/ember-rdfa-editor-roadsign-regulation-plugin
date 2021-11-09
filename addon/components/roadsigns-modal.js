import { action } from '@ember/object';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency-decorators';
import fetchRoadsignsData, { fetchSigns } from '../utils/fetchData';

const PAGE_SIZE = 10;

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
  @tracked count;
  @tracked pageStart = 0;
  @tracked pageEnd = 9;
  @tracked hasNextPage = true;
  @tracked hasPreviousPage = false;

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
    const { signs, classifications, count } = yield fetchRoadsignsData();
    this.tableData = signs;
    this.categoryOptions = classifications;
    this.count = count;
  }

  @task
  *refetchSigns() {
    const {signs, count} = yield fetchSigns(
      this.typeSelected ? this.typeSelected.value : undefined,
      this.codeFilter,
      this.descriptionFilter,
      this.categorySelected ? this.categorySelected.value : undefined,
      this.pageStart
    );
    this.tableData = signs;
    this.count = count;
  }

  @action
  insertHtml(html) {
    this.args.controller.executeCommand('insert-html', html);
  }

  @action
  goToPreviousPage() {
    this.pageStart = this.pageStart - PAGE_SIZE;
    this.pageEnd = this.pageStart + (PAGE_SIZE - 1);
    if (this.pageStart === 0) {
      this.hasPreviousPage = false;
    } else {
      this.hasPreviousPage = true;
    }
    this.hasNextPage = true;
    this.refetchSigns.perform();
  }

  @action
  goToNextPage() {
    this.pageStart = this.pageStart + PAGE_SIZE;
    if (this.pageStart + (PAGE_SIZE - 1) >= this.count) {
      this.hasNextPage = false;
      this.pageEnd = this.count;
    } else {
      this.pageEnd = this.pageStart + (PAGE_SIZE - 1);
      this.hasNextPage = true;
    }
    this.hasPreviousPage = true;
    this.refetchSigns.perform();
  }
}
