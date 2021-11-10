import { action } from '@ember/object';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency-decorators';
import fetchRoadsignsData, { fetchSigns } from '../utils/fetchData';
import { v4 as uuid } from 'uuid';

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
}
