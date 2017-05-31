import Posn from 'geometry/posn';
import CubicBezier from 'geometry/cubic-bezier-line-segment';
import Point from 'geometry/point';
import {
  MoveTo,
  LineTo,
  CurveTo,

} from 'geometry/point';

const POINT_MATCHER = /[MLCSHV][\-\de\.\,\-\s]+/gi

// Geometry conversions and operations

export default {
  pathSegment(a, b) {
    // Returns the LineSegment or BezierCurve that connects two bezier points
    //   (MoveTo, LineTo, CurveTo, SmoothTo)
    //
    // I/P:
    //   a: first point
    //   b: second point
    // O/P: LineSegment or CubiBezier

    if (b == null) { b = a.succ; }
    if (b instanceof LineTo) {
      return new LineSegment(new Posn(a.x, a.y), new Posn(b.x, b.y), b);

    } else if (b instanceof CurveTo) {
      // CurveTo creates a CubicBezier

      return new CubicBezier(
        new Posn(a.x, a.y),
        new Posn(b.x2, b.y2),
        new Posn(b.x3, b.y3),
        new Posn(b.x, b.y), b);
    }
  },

  nextSubstantialPathSegment(point) {
    // Skip any points within 1e-6 of each other
    while (point.within(1e-6, point.succ)) {
      point = point.succ;
    }

    return this.pathSegment(point, point.succ);
  },

  previousSubstantialPathSegment(point) {
    // Skip any points within 1e-6 of each other
    while (point.within(1e-6, point.prec)) {
      point = point.prec;
    }

    return this.pathSegment(point, point.prec);
  }
};

