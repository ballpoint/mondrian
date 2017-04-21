import CursorTracking from 'ui/cursor-tracking';
import Layer from 'ui/layer';
import 'canvas.scss';

export default class Canvas {
  constructor(parent) {
    this.layers = [];
    this.layersMap = {};
    this.handlersMap = {};

    this.container = document.createElement('div');
    this.container.className = 'canvas-container';

    this.cursor = new CursorTracking(this.container);

    parent.appendChild(this.container);
  }

  createLayer(id, handler) {
    let layer = new Layer(id);
    this.layers.push(layer);
    this.layersMap[id] = layer;
    this.handlersMap[id] = handler;

    this.container.appendChild(layer.node);
  }

  updateDimensions() {
    let w = this.container.offsetWidth;
    let h = this.container.offsetHeight;
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
