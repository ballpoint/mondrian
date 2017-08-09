import Bounds from "geometry/bounds";
import Projection from "ui/projection";
import { scaleLinear } from "d3-scale";
import Canvas from "ui/canvas";

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
    let fb = bounds.fitToDimensions(maxWidth, maxHeight);
    layer.setDimensions(fb.width, fb.height);
    let x = scaleLinear()
      .domain([bounds.x, bounds.width + bounds.x])
      .range([0, fb.width]);
    let y = scaleLinear()
      .domain([bounds.y, bounds.height + bounds.y])
      .range([0, fb.height]);
    let z = fb.width / bounds.width;
    this.projection = new Projection(x, y, z);

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
