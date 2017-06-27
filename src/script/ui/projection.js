import Posn from 'geometry/posn';
import Bounds from 'geometry/bounds';
import LineSegment from 'geometry/line-segment';
import CubicBezier from 'geometry/cubic-bezier-line-segment';
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

  line(line) {
    if (line instanceof LineSegment) {
      return new LineSegment(
        this.posn(line.p1),
        this.posn(line.p2)
      );
    } else if (line instanceof CubicBezier) {
      return new CubicBezier(
        this.posn(line.p1),
        this.posn(line.p2),
        this.posn(line.p3),
        this.posn(line.p4)
      );
    }
  }
}
