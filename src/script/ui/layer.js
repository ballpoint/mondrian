export default class Layer {
  constructor(id) {
    this.id = id;

    this.node = document.createElement('canvas');

    this.context = this.node.getContext('2d');
  }

  setDimensions(w, h) {
    let ratio = window.devicePixelRatio || 1;

    this.width = w;
    this.height = h;

    this.node.width  = w*ratio;
    this.node.height = h*ratio;

    this.node.style.width  = w;
    this.node.style.height = h;

    this.context.scale(ratio, ratio);
  }

  clear() {
    this.context.clearRect(0, 0, this.width, this.height);
  }

  drawRect(bounds, opts={}) {
    let { x, y, width, height } = bounds;

    if (opts.centerPosn) {
      x -= (width/2);
      y -= (height/2);
    }

    if (opts.fill) {
      this.context.fillStyle = opts.fill;
      this.context.fillRect(x, y, width, height);
    }
    if (opts.stroke) {
      this.context.strokeStyle = opts.stroke;
      this.context.strokeRect(x, y, width, height);
    }
  }
}
