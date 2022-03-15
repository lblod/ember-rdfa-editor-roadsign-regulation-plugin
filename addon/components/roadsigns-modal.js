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
const SIGN_TYPE_URI =
  'https://data.vlaanderen.be/ns/mobiliteit#Verkeersbordconcept';
const ROAD_MARKING_URI =
  'https://data.vlaanderen.be/ns/mobiliteit#Wegmarkeringconcept';
const TRAFFIC_LIGHT_URI =
  'https://data.vlaanderen.be/ns/mobiliteit#Verkeerslichtconcept';
const measureTypes = [SIGN_TYPE_URI, ROAD_MARKING_URI, TRAFFIC_LIGHT_URI];
export default class RoadsignRegulationCard extends Component {
  endpoint;

  pageSize = PAGE_SIZE;
  @service roadsignRegistry;

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

  @tracked selectedCode;
  @tracked selectedCodeCombination;

  @tracked tableData = [];
  @tracked count;
  @tracked pageStart = 0;

  get isNotTypeSign() {
    if (!this.typeSelected) return true;
    return this.typeSelected.value !== SIGN_TYPE_URI;
  }

  constructor() {
    super(...arguments);
    const config = getOwner(this).resolveRegistration('config:environment');
    this.endpoint = config.roadsignRegulationPlugin.endpoint;
    this.fetchData.perform();
  }

  @action
  selectTypeOrCategory(option) {
    if (measureTypes.includes(option.value)) {
      this.typeSelected = option;
      this.categorySelected = undefined;
    } else {
      this.typeSelected = undefined;
      this.categorySelected = option;
    }
    this.search();
  }

  @action
  changeCode(value) {
    this.selectedCode = value;
    this.selectedCodeCombination = undefined;
    this.search();
  }

  @action
  changeCodeCombination(value) {
    this.selectedCodeCombination = value;
    this.search();
  }

  @action
  changeDescription(e) {
    this.descriptionFilter = e.target.value;
    this.search();
  }

  @action
  selectCategory(value) {
    this.categorySelected = value;
    this.search();
  }

  @action
  selectZonality(value) {
    this.zonalitySelected = value;
    this.search();
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

  @action
  searchCombineCodes(term) {
    const category = this.categorySelected
      ? this.categorySelected.value
      : undefined;
    const type = this.typeSelected ? this.typeSelected.value : undefined;
    const code = this.selectedCode ? this.selectedCode.value : undefined;
    return this.roadsignRegistry.searchCode.perform(term, category, type, code);
  }

  get typeOptions() {
    return [
      {
        groupName: 'Types',
        options: [
          {
            label: 'Verkeersborden',
            value: SIGN_TYPE_URI,
          },
          {
            label: 'Wegmarkeringen',
            value:
              'https://data.vlaanderen.be/ns/mobiliteit#Wegmarkeringconcept',
          },
          {
            label: 'Verkeerslichten',
            value:
              'https://data.vlaanderen.be/ns/mobiliteit#Verkeerslichtconcept',
          },
        ],
      },
      {
        groupName: 'Categories',
        options: this.roadsignRegistry.classifications,
      },
    ];
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
    let codes = [];
    if (this.selectedCodeCombination) {
      codes.push(...this.selectedCodeCombination);
    }
    if (this.selectedCode) {
      codes.push(this.selectedCode);
    }
    const { measures, count } =
      yield this.roadsignRegistry.fetchMeasures.perform({
        zonality: this.zonalitySelected
          ? this.zonalitySelected.value
          : undefined,
        type: this.typeSelected ? this.typeSelected.value : undefined,
        codes: codes.length ? codes.map((code) => code.value) : undefined,
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
