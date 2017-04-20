import Layer from 'ui/layer';

export default class Canvas {
  constructor(parent) {
    this.layers = [];
    this.layersMap = {};

    this.parent = parent;
  }

  createLayer(id) {
    let layer = new Layer(id);
    this.layers.push(layer);
    this.layersMap[id] = layer;

    this.parent.appendChild(layer.node);
  }

  setDimensions(w, h) {
    for (let layer of this.layers) {
      layer.node.setAttribute('width', w);
      layer.node.setAttribute('height', w);
    }
  }
}
