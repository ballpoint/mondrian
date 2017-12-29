import Bounds from 'geometry/bounds';
import Projection from 'ui/projection';
import { scaleLinear } from 'd3-scale';
import Canvas from 'ui/canvas';
import Layer from 'ui/layer';

const THUMBNAIL_DIMEN = 300;

export default class Thumb {
  constructor(elems, opts = {}) {
    this.elems = elems;
    this.opts = opts;

    // Find max stroke-width for padding
    this.padding = 0;
    /*
    for (let elem of elems) {
      if (elem.data) {
        let sw = parseInt(elem.data['stroke-width'], 10);
        sw /= 2;
        if (!isNaN(sw) && this.padding < sw) {
          this.padding = sw;
        }
      }
    }
    */
  }

  drawTo(layer) {
    let boundsList = [];
    for (let elem of this.elems) {
      if (_.isFunction(elem.bounds)) {
        boundsList.push(elem.bounds());
      } else {
        boundsList.push(elem.bounds);
      }
    }
    let bounds = Bounds.fromBounds(boundsList).padded(this.padding || 0);
    let maxWidth = this.opts.maxWidth || 100;
    let maxHeight = this.opts.maxHeight || 100;
    this.projection = Projection.forBoundsFit(bounds, maxWidth, maxHeight);
    layer.setDimensions(this.projection.width, this.projection.height);

    for (let elem of this.elems) {
      elem.drawToCanvas(layer, layer.context, this.projection);
    }
  }

  drawAndFetchRaw(width, height) {
    let canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    let layer = new Layer('thumb', canvas);
    this.drawTo(layer);

    return new Promise(function(resolve, reject) {
      canvas.toBlob(blob => {
        resolve(blob);
      }, 'image/png');
    });
  }
}
