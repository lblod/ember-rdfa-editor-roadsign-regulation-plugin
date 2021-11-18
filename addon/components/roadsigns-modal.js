import { action } from '@ember/object';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { task, restartableTask } from 'ember-concurrency-decorators';
import fetchRoadsignsData, { fetchSigns } from '../utils/fetchData';
import { getOwner } from '@ember/application';
import { v4 as uuid } from 'uuid';

const PAGE_SIZE = 10;

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
    this.fetchData.perform();
  }

  @action
  selectType(value) {
    this.typeSelected = value;
  }

  @action
  changeCode(e) {
    this.codeFilter = e.target.value;
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
    console.log(signs)
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

  @task
  *insertHtml(row) {
    const mappings = yield fetchMappings(row.uri);
    const html = includeMappings(row.templateValue, mappings);
    const wrappedHtml = `
      <div property="eli:has_part" typeof="besluit:Artikel" resource="http://data.lblod.info/artikels/${uuid()}">
        <div property="eli:number" datatype="xsd:string">Artikel <span class="mark-highlight-manual">nummer</span></div>
        <span style="display:none;" property="eli:language" resource="http://publications.europa.eu/resource/authority/language/NLD" typeof="skos:Concept">&nbsp;</span>
        <div property="prov:value" datatype="xsd:string">
          <span class="mark-highlight-manual">Voer inhoud in</span>
        </div>
        <div property="mobiliteit:heeftVerkeersmaatregel" typeof="mobiliteit:Mobiliteitsmaatregel" resource="http://data.lblod.info/mobiliteitsmaatregel/${uuid()}">
          <div property="dct:description">
            ${html}
          </div>
        </div>
      </div>
    `;
    this.args.controller.executeCommand('insert-html', wrappedHtml);
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
