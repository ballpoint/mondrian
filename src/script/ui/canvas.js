import Posn from "geometry/posn";
import Bounds from "geometry/bounds";
import EventEmitter from "lib/events";
import Layer from "ui/layer";

export default class Canvas extends EventEmitter {
  constructor(parent) {
    super();

    this.layers = [];
    this.layersMap = {};
    this.handlersMap = {};

    this.refreshNeeded = {};

    if (parent) {
      this.container = document.createElement("div");
      this.container.className = "canvas-container";
      parent.appendChild(this.container);

      window.onresize = () => {
        this.updateDimensions();
        this.refreshAll();
      };
    } // Otherwise run in headless mode
  }

  createLayer(id, handler) {
    let layer = new Layer(id);
    this.layers.push(layer);
    this.layersMap[id] = layer;

    if (handler) {
      this.handlersMap[id] = handler;
    }

    if (this.container) {
      this.container.appendChild(layer.node);
    }

    this.updateDimensions();

    return layer;
  }

  updateDimensions() {
    if (this.container) {
      let w = this.container.offsetWidth;
      let h = this.container.offsetHeight;
      this.setDimensions(w, h);
    }
  }

  setDimensions(w, h) {
    this.width = w;
    this.height = h;
    for (let layer of this.layers) {
      layer.setDimensions(w, h);
    }
  }

  owns(node) {
    return node.parentNode === this.container;
  }

  center() {
    return new Posn(this.width / 2, this.height / 2);
  }

  bounds() {
    return new Bounds(0, 0, this.width, this.height);
  }

  refreshAll() {
    //console.trace();
    for (let layer of this.layers) {
      this.refresh(layer.id);
    }
  }

  refresh(id) {
    //console.trace();
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
    //console.time('refresh:'+layer.id);
    layer.clear();
    let handler = this.handlersMap[layer.id];
    if (handler) {
      handler(layer, layer.context);
    }
    //console.timeEnd('refresh:'+layer.id);
  }
}
