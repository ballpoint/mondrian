export default class Layer {
  constructor(attrs) {
    this.id = attrs.id;
    this.elements = attrs.elements;
  }

  remove(elem) {
    this.elements = this.elements.filter((existing) => { return existing !== elem });
  }
}
