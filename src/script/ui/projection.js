import Posn from 'geometry/posn';
import Bounds from 'geometry/bounds';
import LineSegment from 'geometry/line-segment';
import CubicBezier from 'geometry/cubic-bezier-line-segment';
import { scaleLinear } from 'd3-scale';
import math from 'lib/math';

export default class Projection {
  constructor(xScale, yScale, zoomLevel) {
    this.x = xScale;
    this.xInvert = xScale.invert;
    this.y = yScale;
    this.yInvert = yScale.invert;
    this.z = n => {
      return n * zoomLevel;
    };
    this.zInvert = n => {
      return n / zoomLevel;
    };
  }

  static forBoundsFit(bounds, width, height) {
    let fb = bounds.fitToDimensions(width, height);
    let x = scaleLinear()
      .domain([bounds.x, bounds.width + bounds.x])
      .range([0, fb.width]);
    let y = scaleLinear()
      .domain([bounds.y, bounds.height + bounds.y])
      .range([0, fb.height]);
    let z = fb.width / bounds.width;

    return new Projection(x, y, z);
  }

  static simple(width, height, scale) {
    return new Projection(
      scaleLinear()
        .domain([0, width])
        .range([0, width * scale]),
      scaleLinear()
        .domain([0, height])
        .range([0, height * scale]),
      1
    );
  }

  posn(posn) {
    return new Posn(this.x(posn.x), this.y(posn.y));
  }

  posnInvert(posn) {
    return new Posn(this.xInvert(posn.x), this.yInvert(posn.y));
  }

  bounds(bounds) {
    if (!bounds) debugger;
    return bounds.transform(this.x, this.y, this.z);
  }

  boundsInvert(bounds) {
    return bounds.transform(this.xInvert, this.yInvert, this.zInvert);
  }

  line(line) {
    if (line instanceof LineSegment) {
      return new LineSegment(this.posn(line.p1), this.posn(line.p2));
    } else if (line instanceof CubicBezier) {
      return new CubicBezier(
        this.posn(line.p1),
        this.posn(line.p2),
        this.posn(line.p3),
        this.posn(line.p4)
      );
    }
  }

  get width() {
    return this.x.range()[1] - this.x.range()[0];
  }

  get height() {
    return this.y.range()[1] - this.y.range()[0];
  }
}
