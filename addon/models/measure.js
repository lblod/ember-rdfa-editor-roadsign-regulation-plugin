import { tracked } from '@glimmer/tracking';

export default class Measure {
  label;
  @tracked signs = [];
  template;
  classifications = new Set();
  annotatedTemplate;
  zonality;

  static fromBinding(binding) {
    const uri = binding.uri.value;
    const label = binding.label.value;
    const template = binding.basicTemplate.value;
    const annotatedTemplate = binding.annotatedTemplate.value;
    const zonality = binding.zonality.value;
    return new Measure(uri, label, template, annotatedTemplate, zonality);
  }

  constructor(uri, label, template, annotatedTemplate, zonality, signs = null) {
    this.label = label;
    this.uri = uri;
    this.template = template;
    this.zonality = zonality;
    this.annotatedTemplate = annotatedTemplate;
    this.signs = signs;
  }
}
