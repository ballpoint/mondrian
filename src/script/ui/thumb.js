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
  }

  drawTo(layer) {
    console.trace();
    let boundsList = [];
    for (let elem of this.elems) {
      if (_.isFunction(elem.bounds)) {
        boundsList.push(elem.bounds());
      } else {
        boundsList.push(elem.bounds);
      }
    }
    let bounds = Bounds.fromBounds(boundsList);
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
        console.log(blob);
        resolve(blob);
      }, 'image/png');
    });
  }
}
