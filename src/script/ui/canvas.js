import Posn from 'geometry/posn';
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

    window.onresize = () => {
      this.updateDimensions();
      this.refreshAll();
    }
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
    this.width = w;
    this.height = h;
    for (let layer of this.layers) {
      layer.setDimensions(w, h);
    }
  }

  center() {
    return new Posn(this.width/2, this.height/2);
  }

  refreshAll() {
    for (let layer of this.layers) {
      this.refresh(layer.id);
    }
  }

  refresh(id) {
    let layer = this.layersMap[id];
    layer.clear();
    let handler = this.handlersMap[id];
    handler(layer, layer.context);
  }
}
