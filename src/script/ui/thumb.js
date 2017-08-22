import Bounds from 'geometry/bounds';
import Projection from 'ui/projection';
import { scaleLinear } from 'd3-scale';
import Canvas from 'ui/canvas';

const THUMBNAIL_DIMEN = 300;

export default class Thumb {
  constructor(elems, opts = {}) {
    this.elems = elems;
    this.opts = opts;
  }

  drawTo(layer) {
    let boundsList = [];
    for (let elem of this.elems) {
      boundsList.push(elem.bounds());
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
}

export function thumbForElements(elements) {
  let bounds = elems.map(elem => {
    return elem.bounds();
  });
}
