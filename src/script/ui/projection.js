import Posn from 'geometry/posn';
import math from 'lib/math';

export default class Projection {

  constructor(xScale, yScale, zoomLevel, sharpen=false) {
    if (sharpen) {
      // Sharpen rounds numbers off to have a remainder of 0.5
      // because canvas renders strokes on the center line
      this.x       = (n) => { return math.sharpen(xScale(n)) };
      this.xInvert = (n) => { return math.sharpen(xScale.invert(n)) };
      this.y       = (n) => { return math.sharpen(yScale(n)) };
      this.yInvert = (n) => { return math.sharpen(yScale.invert(n)) };
      this.z       = (n) => { return math.sharpen(n * zoomLevel) };
      this.zInvert = (n) => { return math.sharpen(n / zoomLevel) };
    } else {
      this.x       = xScale;
      this.xInvert = xScale.invert;
      this.y       = yScale;
      this.yInvert = yScale.invert;
      this.z       = (n) => { return n * zoomLevel }
      this.zInvert = (n) => { return n / zoomLevel }
    }
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
