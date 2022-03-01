import { action } from '@ember/object';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { task, restartableTask } from 'ember-concurrency';
import { getOwner } from '@ember/application';
import { v4 as uuid } from 'uuid';
import { inject as service } from '@ember/service';
import includeInstructions from '../utils/includeInstructions';
import {
  ZONAL_URI,
  NON_ZONAL_URI,
  POTENTIALLY_ZONAL_URI,
} from '../utils/constants';

const PAGE_SIZE = 10;
export default class RoadsignRegulationCard extends Component {
  endpoint;

  pageSize = PAGE_SIZE;
  @service roadsignRegistry;

  @tracked typeOptions = [
    {
      label: 'Verkeersborden',
      value: 'https://data.vlaanderen.be/ns/mobiliteit#Verkeersbordconcept',
    },
    {
      label: 'Wegmarkeringen',
      value: 'https://data.vlaanderen.be/ns/mobiliteit#Wegmarkeringconcept',
    },
    {
      label: 'Verkeerslichten',
      value: 'https://data.vlaanderen.be/ns/mobiliteit#Verkeerslichtconcept',
    },
  ];
  @tracked typeSelected;

  @tracked categorySelected;

  @tracked zonalityOptions = [
    {
      label: 'Zonaal',
      value: ZONAL_URI,
    },
    {
      label: 'Niet zonaal',
      value: NON_ZONAL_URI,
    },
  ];
  @tracked zonalitySelected;

  @tracked codesFilter;
  @tracked descriptionFilter = '';

  @tracked tableData = [];
  @tracked count;
  @tracked pageStart = 0;

  get isNotTypeSign() {
    if (!this.typeSelected) return true;
    return (
      this.typeSelected.value !==
      'https://data.vlaanderen.be/ns/mobiliteit#Verkeersbordconcept'
    );
  }

  constructor() {
    super(...arguments);
    const config = getOwner(this).resolveRegistration('config:environment');
    this.endpoint = config.roadsignRegulationPlugin.endpoint;
    this.fetchData.perform();
  }

  @action
  selectType(value) {
    this.typeSelected = value;
    this.search();
  }

  @action
  changeCodes(value) {
    this.codesFilter = value;
  }

  @action
  changeDescription(e) {
    this.descriptionFilter = e.target.value;
  }

  @action
  selectCategory(value) {
    this.categorySelected = value;
  }

  @action
  selectZonality(value) {
    this.zonalitySelected = value;
  }

  @action
  closeModal() {
    this.count = null;
    this.tableData = [];
    this.args.closeModal();
  }

  @action
  searchCodes(term) {
    const category = this.categorySelected
      ? this.categorySelected.value
      : undefined;
    const type = this.typeSelected ? this.typeSelected.value : undefined;
    return this.roadsignRegistry.searchCode.perform(term, category, type);
  }

  get categoryOptions() {
    return this.roadsignRegistry.classifications;
  }

  @task
  *fetchData() {
    const { measures, count } =
      yield this.roadsignRegistry.fetchMeasures.perform();
    this.tableData = measures;
    this.count = count;
  }

  @restartableTask
  *refetchSigns() {
    const { measures, count } =
      yield this.roadsignRegistry.fetchMeasures.perform({
        zonality: this.zonalitySelected
          ? this.zonalitySelected.value
          : undefined,
        type: this.typeSelected ? this.typeSelected.value : undefined,
        codes: this.codesFilter
          ? this.codesFilter.map((code) => code.value)
          : undefined,
        category: this.categorySelected
          ? this.categorySelected.value
          : undefined,
        pageStart: this.pageStart,
      });
    this.tableData = measures;
    this.count = count;
  }

  @action
  async insertHtml(measure, zonalityValue, temporalValue) {
    const instructions =
      await this.roadsignRegistry.fetchInstructionsForMeasure.perform(
        measure.uri
      );
    const zonality = zonalityValue ? zonalityValue : measure.zonality;
    const html = includeInstructions(
      measure.annotatedTemplate,
      instructions,
      true
    );
    const signsHTML = measure.signs
      .map((sign) => {
        const roadSignUri = 'http://data.lblod.info/verkeerstekens/' + uuid();
        return `<li style="margin-bottom:1rem;"><span property="mobiliteit:wordtAangeduidDoor" resource=${roadSignUri} typeof="mobiliteit:Verkeersbord-Verkeersteken">
        <span property="mobiliteit:heeftVerkeersbordconcept" resource="${
          sign.uri
        }" typeof="mobiliteit:Verkeersbordconcept" style="display:flex;align-items:center;">
          <img property="mobiliteit:grafischeWeergave" src="${
            sign.image
          }"  style="width:5rem;margin-right:1rem;margin-left:0;" />
          <span property="skos:prefLabel" style="padding-bottom:0;margin-left:0;margin-right:.4rem;">${
            sign.code
          }</span>
          <span style="margin-left:0;margin-top:0;">${
            sign.zonality === POTENTIALLY_ZONAL_URI && zonality === ZONAL_URI
              ? 'met zonale geldigheid'
              : ''
          }
          </span>
          </span>
        </span>
      </li>`;
      })
      .join('\n');

    this.args.controller.executeCommand(
      'insert-article',
      this.args.controller,
      `<div property="mobiliteit:heeftVerkeersmaatregel" typeof="mobiliteit:Mobiliteitsmaatregel" resource="http://data.lblod.info/mobiliteitsmaatregels/${uuid()}">
        <span style="display:none;" property="prov:wasDerivedFrom" resource="${
          measure.uri
        }">&nbsp;</span>
        <span style="display:none;" property="ext:zonality" resource="${zonality}"></span>
        <span style="display:none;" property="ext:temporal" value="${
          measure.temporal
        }"></span>
          <div property="dct:description">
            ${html}
            <p>Dit wordt aangeduid door verkeerstekens:</p>
            <ul style="list-style:none;">
              ${signsHTML}
            </ul>
            ${temporalValue === 'true' ? 'Deze signalisatie is dynamisch.' : ''}
          </div>
        </div>
      `
    );
    this.args.closeModal();
  }

  @action
  goToPage(pageStart) {
    this.pageStart = pageStart;
    this.refetchSigns.perform();
  }
  @action
  search() {
    this.pageStart = 0;
    this.refetchSigns.perform();
  }
}
