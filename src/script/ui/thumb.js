import Bounds from 'geometry/bounds';
import Projection from 'ui/projection';
import { scaleLinear } from 'd3-scale';
import Canvas from 'ui/canvas';

const THUMBNAIL_DIMEN = 300;

export default class Thumb {
  constructor(bounds) {
    this.canvas = new Canvas();    
    this.bounds = bounds;
    let fb = bounds.fitToDimension(THUMBNAIL_DIMEN);
    let x = scaleLinear().domain([bounds.x, bounds.width+bounds.x]).range([0, fb.width]);
    let y = scaleLinear().domain([bounds.y, bounds.height+bounds.y]).range([0, fb.height]);
    let z = fb.width / bounds.width;
    this.projection = new Projection(x, y, z);
    this.layer = this.canvas.createLayer('main');
    this.canvas.setDimensions(fb.width, fb.height);
  }

  draw(elem) {
    elem.drawToCanvas(this.layer, this.layer.context, this.projection);
  }

  static fromElements(elems) {
    let boundsList = [];
    for (let elem of elems) {
      boundsList.push(elem.bounds());
    }
    let bounds = Bounds.fromBounds(boundsList);
    let thumb = new Thumb(bounds);

    for (let elem of elems) {
      thumb.draw(elem);
    }

    thumb.cache();
    return thumb;

  }

  cache() {
    this.url = this.layer.url;
  }
}

export function thumbForElements(elements) {
  let bounds = elems.map((elem) => { 
    return elem.bounds();
  });
}
