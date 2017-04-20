import Layer from 'ui/layer';

export default class Canvas {
  constructor(parent) {
    this.layers = [];
    this.layersMap = {};
    this.handlersMap = {};

    this.parent = parent;
  }

  createLayer(id, handler) {
    let layer = new Layer(id);
    this.layers.push(layer);
    this.layersMap[id] = layer;
    this.handlersMap[id] = handler;

    this.parent.appendChild(layer.node);
  }

  updateDimensions() {
    let w = this.parent.offsetWidth;
    let h = this.parent.offsetHeight;
    for (let layer of this.layers) {
      layer.setDimensions(w, h);
    }
  }

  refresh() {
    for (let layer of this.layers) {
      let handler = this.handlersMap[layer.id];
      handler(layer, layer.context);
    }
  }
}
