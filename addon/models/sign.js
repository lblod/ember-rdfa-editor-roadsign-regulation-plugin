export default class Sign {
  code;
  image;
  classifications = [];
  uri;
  order;
  zonality;
  static fromBinding(binding) {
    const code = binding.code.value;
    const image = binding.image.value;
    const uri = binding.uri.value;
    const order = binding.order.value;
    const classifications = binding.classifications.value.split('|');
    const zonality = binding.zonality.value;
    return new Sign(code, image, classifications, uri, order);
  }

  constructor(code, image, classifications, uri, order, zonality) {
    this.code = code;
    this.image = image;
    this.classifications = classifications;
    this.uri = uri;
    this.order = order;
    this.zonality = zonality;
  }
}
