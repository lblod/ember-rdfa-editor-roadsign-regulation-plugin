export default class Sign {
  code;
  image;
  classifications = [];
  uri;
  order;
  zonality;
  static fromBinding(binding) {
    const code = binding.code.value;
    const image = Sign.processImage(binding.image.value, binding.imageBaseUrl);

    const uri = binding.uri.value;
    const order = binding.order.value;
    const classifications = binding.classifications
      ? binding.classifications.value.split('|')
      : [];
    const zonality = binding.zonality.value;
    return new Sign(code, image, classifications, uri, order, zonality);
  }

  constructor(code, image, classifications, uri, order, zonality) {
    this.code = code;
    this.image = image;
    this.classifications = classifications;
    this.uri = uri;
    this.order = order;
    this.zonality = zonality;
  }
  static processImage(url, imageBaseUrl) {
    const isAbsoluteRegex = new RegExp('^(?:[a-z]+:)?//', 'i');
    if (isAbsoluteRegex.test(url)) {
      return url;
    } else {
      return `${imageBaseUrl}${url}`;
    }
  }
}
