export default class Instruction {
  name;
  template;
  annotatedTemplate;

  static fromBinding(binding) {
    return new Instruction(
      binding.name.value,
      binding.template.value,
      binding.annotatedTemplate.value
    );
  }

  constructor(name, template, annotatedTemplate) {
    this.name = name;
    this.template = template;
    this.annotatedTemplate = annotatedTemplate;
  }
}
