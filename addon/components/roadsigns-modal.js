import { action } from '@ember/object';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { task, restartableTask, timeout } from 'ember-concurrency';
import { getOwner } from '@ember/application';
import { v4 as uuid } from 'uuid';

import fetchRoadsignsData, { fetchSigns } from '../utils/fetchData';
import includeInstructions from '../utils/includeInstructions';

const PAGE_SIZE = 10;
const DEBOUNCE_MS = 100;
export default class RoadsignRegulationCard extends Component {
  endpoint;

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
  @tracked pageEnd = PAGE_SIZE - 1;
  @tracked hasNextPage = true;
  @tracked hasPreviousPage = false;

  constructor() {
    super(...arguments);
    const config = getOwner(this).resolveRegistration('config:environment');
    this.endpoint = config.roadsignRegulationPlugin.endpoint;
  }

  @action
  selectType(value) {
    this.typeSelected = value;
    this.search();
  }

  @restartableTask
  *changeCode(e) {
    this.codeFilter = e.target.value;
    yield timeout(DEBOUNCE_MS);
    this.search();
  }

  @action
  changeDescription(e) {
    this.descriptionFilter = e.target.value;
  }

  @action
  selectCategory(value) {
    this.categorySelected = value;
  }

  @task
  *fetchData() {
    const { signs, classifications, count } = yield fetchRoadsignsData(
      this.endpoint
    );
    this.tableData = signs;
    this.categoryOptions = classifications;
    this.count = count;
    if (count < this.pageEnd) {
      this.pageEnd = count;
      this.hasNextPage = false;
    }
  }

  @restartableTask
  *refetchSigns() {
    const { signs, count } = yield fetchSigns(
      this.endpoint,
      this.typeSelected ? this.typeSelected.value : undefined,
      this.codeFilter,
      this.descriptionFilter,
      this.categorySelected ? this.categorySelected.value : undefined,
      this.pageStart
    );
    this.tableData = signs;
    this.count = count;
    if (count < this.pageEnd) {
      this.pageEnd = count;
      this.hasNextPage = false;
    }
  }

  @action
  insertHtml(row) {
    const instructions = row.instructions;
    const html = includeInstructions(row.templateAnnotated, instructions, true);
    const wrappedHtml = `
      <div property="eli:has_part" prefix="mobiliteit: https://data.vlaanderen.be/ns/mobiliteit#" typeof="besluit:Artikel" resource="http://data.lblod.info/artikels/${uuid()}">
        <div property="eli:number" datatype="xsd:string">Artikel <span class="mark-highlight-manual">nummer</span></div>
        <span style="display:none;" property="eli:language" resource="http://publications.europa.eu/resource/authority/language/NLD" typeof="skos:Concept">&nbsp;</span>
        <div propert="prov:value" datatype="xsd:string">
          <div property="mobiliteit:heeftVerkeersmaatregel" typeof="mobiliteit:Mobiliteitsmaatregel" resource="http://data.lblod.info/mobiliteitsmaatregel/${uuid()}">
            <div property="dct:description">
              ${html}
            </div>
          </div>
        </div>
      </div>
    `;
    this.args.insert(wrappedHtml);
    this.args.closeModal();
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
  @action
  search() {
    this.pageStart = 0;
    this.pageEnd = PAGE_SIZE - 1;
    this.hasNextPage = true;
    this.hasPreviousPage = false;
    this.refetchSigns.perform();
  }
}
