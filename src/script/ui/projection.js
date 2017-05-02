import Posn from 'geometry/posn';
import math from 'lib/math';

export default class Projection {

  constructor(xScale, yScale, zoomLevel) {
    this.x       = xScale;
    this.xInvert = xScale.invert;
    this.y       = yScale;
    this.yInvert = yScale.invert;
    this.z       = (n) => { return n * zoomLevel }
    this.zInvert = (n) => { return n / zoomLevel }
  }

  posn(posn) {
    return new Posn(this.x(posn.x), this.y(posn.y));
  }

  posnInvert(posn) {
    return new Posn(this.xInvert(posn.x), this.yInvert(posn.y));
  }

  bounds(bounds) {
    return bounds.transform(this.x, this.y, this.z);
  }

  boundsInvert(bounds) {
    return bounds.transform(this.xInvert, this.yInvert, this.zInvert);
  }
}
