import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';
import includeInstructions from '@lblod/ember-rdfa-editor-roadsign-regulation-plugin/utils/includeInstructions';
import { tracked } from '@glimmer/tracking';

export default class MeasureTemplateComponent extends Component {
  @service roadsignRegistry;
  @tracked template = '';

  constructor() {
    super(...arguments);
    this.template = this.args.template;
    this.fetchData.perform();
  }

  @task
  * fetchData() {
    const instructions = yield this.roadsignRegistry.getInstructionsForMeasure.perform(this.args.measure);
    let template = includeInstructions(this.args.template, instructions, this.args.annotated);
    this.template = template;
  }
}
