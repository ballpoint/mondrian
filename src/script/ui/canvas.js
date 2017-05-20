import Posn from 'geometry/posn';
import EventEmitter from 'lib/events';
import Layer from 'ui/layer';
import 'canvas.scss';

export default class Canvas extends EventEmitter {
  constructor(parent) {
    super();

    this.layers = [];
    this.layersMap = {};
    this.handlersMap = {};

    this.refreshNeeded = {};

    this.container = document.createElement('div');
    this.container.className = 'canvas-container';

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
    this.refreshNeeded[id] = true;
    if (!this.frameRequest) {
      this.frameRequest = window.requestAnimationFrame(() => {
        delete this.frameRequest;
        for (let layer of this.layers) {
          if (this.refreshNeeded[layer.id]) {
            this._refreshLayer(layer);
          }
        }
        this.refreshNeeded = {};
      });
    }
  }

  _refreshLayer(layer) {
    layer.clear();
    let handler = this.handlersMap[layer.id];
    handler(layer, layer.context);
  }

}
