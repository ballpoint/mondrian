export default class Layer {
  constructor(id) {
    this.id = id;

    this.node = document.createElement('canvas');

    this.context = this.node.getContext('2d');
  }

  setDimensions(w, h) {
    let ratio = window.devicePixelRatio || 1;


    this.node.width  = w*ratio;
    this.node.height = h*ratio;

    this.node.style.width  = w;
    this.node.style.height = h;

    this.context.scale(ratio, ratio);
  }
}
