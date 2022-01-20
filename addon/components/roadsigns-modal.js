import { action } from '@ember/object';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { task, restartableTask, timeout } from 'ember-concurrency';
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
const DEBOUNCE_MS = 100;
export default class RoadsignRegulationCard extends Component {
  endpoint;

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

  @action
  selectZonality(value) {
    this.zonalitySelected = value;
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
    if (count <= this.pageEnd) {
      this.pageEnd = count - 1;
      this.hasNextPage = false;
    }
  }

  @restartableTask
  *refetchSigns() {
    const { measures, count } =
      yield this.roadsignRegistry.fetchMeasures.perform({
        zonality: this.zonalitySelected
          ? this.zonalitySelected.value
          : undefined,
        type: this.typeSelected ? this.typeSelected.value : undefined,
        code: this.codeFilter,
        category: this.categorySelected
          ? this.categorySelected.value
          : undefined,
        pageStart: this.pageStart,
      });
    this.tableData = measures;
    this.count = count;
    if (count <= this.pageEnd) {
      this.pageEnd = count - 1;
      this.hasNextPage = false;
    }
  }

  @action
  async insertHtml(measure, zonalityValue = null) {
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
        <span style="display:none;" property="ext:zonality" resource="${
          measure.zonality
        }"></span>
          <div property="dct:description">
            ${html}
            <p>Dit wordt aangeduid door verkeerstekens:</p>
            <ul style="list-style:none;">
              ${signsHTML}
            </ul>
          </div>
        </div>
      `
    );
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
      this.pageEnd = this.count - 1;
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
