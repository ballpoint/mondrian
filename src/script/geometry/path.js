import Monsvg from 'geometry/monsvg'
import PointsList from 'geometry/points-list'
import Range from 'geometry/range'
import lab from 'lab/lab'
import conversions from 'lab/conversions'
import Posn from 'geometry/posn';
import {
  MoveTo,
  LineTo,
  CurveTo,
} from 'geometry/point';

/*

  Path

  Highest order of vector data. Lowest level of expression.

*/

export default class Path extends Monsvg {
  static initClass() {
    this.prototype.type = 'path';
  
    // Caching expensive metadata
    this.prototype.caching = true;
    this.prototype.xRangeCached = null;
    this.prototype.yRangeCached = null;
    this.prototype.lineSegmentsCached = null;
  }

  constructor(data) {
    super(data);
    if (this.data && this.data.d) {
      this.importNewPoints(this.data.d);
    }
  }

  commitPoints() {
    this.data.d = this.points.toString();
  }

  importNewPoints(points) {
    if (points instanceof PointsList) {
      this.points = points;
    } else if (typeof(points) === 'string') {
      this.points = PointsList.fromString(points, this);
    }

    this.clearCachedObjects();

    return this;
  }

  xRange() {
    let cached = this.xRangeCached;
    if (cached !== null) {
      return cached;
    } else {
      return this.xRangeCached = Range.fromList(this.lineSegments().map((x) => {
        let xr = x.xRange();
        if (isNaN(xr.min) || isNaN(xr.max)) debugger;
        return xr;
      }));
    }
  }

  yRange() {
    let cached = this.yRangeCached;
    if (cached !== null) {
      return cached;
    } else {
      return this.yRangeCached = Range.fromList(this.lineSegments().map(x => x.yRange()));
    }
  }

  nudgeCachedObjects(x, y) {
    if (this.boundsCached != null) {
      this.boundsCached.nudge(x, y);
    }
    if (this.xRangeCached != null) {
      this.xRangeCached.nudge(x);
    }
    if (this.yRangeCached != null) {
      this.yRangeCached.nudge(y);
    }
    return (this.lineSegmentsCached != null ? this.lineSegmentsCached.map(ls => ls.nudge(x, y)) : undefined);
  }

  scaleCachedObjects(x, y, origin) {
    if (this.boundsCached != null) {
      this.boundsCached.scale(x, y, origin);
    }
    if (this.xRangeCached != null) {
      this.xRangeCached.scale(x, origin.x);
    }
    if (this.yRangeCached != null) {
      this.yRangeCached.scale(y, origin.y);
    }
    this.lineSegmentsCached = null;
  }

  clearCachedObjects() {
    this.lineSegmentsCached = null;
    this.boundsCached = null;
    this.xRangeCached = null;
    this.yRangeCached = null;
    return this;
  }

  lineSegments() {
    // No I/P
    //
    // O/P: A list of LineSegments and/or CubicBeziers representing this path
    let cached = this.lineSegmentsCached;
    if (cached !== null) {
      return cached;
    } else {
      let segments = [];
      for (let p of this.points.all()) {
        let ps = conversions.pathSegment(p, p.succ);
        if (ps) {
          segments.push(ps);
        }
      }
      this.lineSegmentsCached = segments;
      return segments.slice(0);
    }
  }

  scale(x, y, origin) {
    // Keep track of cached bounds and line segments
    if (origin == null) { origin = this.center(); }
    this.scaleCachedObjects(x, y, origin);

    // We might need to rotate and unrotate this thing
    // to keep its angle true. This way we can scale at angles
    // after we rotate shapes.
    let { angle } = this.metadata;

    // Don't do unecessary work: only do rotation if shape has an angle other than 0
    if (angle !== 0) {
      // Rotate the shape to normal (0 degrees) before doing the scaling.
      this.rotate(360 - angle, origin);
    }

    // After we've unrotated it, scale it
    this.points.map(a => a.scale(x, y, origin));

    if (angle !== 0) {
      // ...and rotate it back to where it should be.
      this.rotate(angle, origin);
    }

    // Boom
    this.commitPoints();

    // Carry out on virgin rep
    return (this.virgin != null ? this.virgin.scale(x, y, origin) : undefined);
  }


  nudge(x, y) {
    // Nudge
    this.points.map(p => p.nudge(x, y, false));

    // Nudge the cached bounds and line segments if they're there
    // to keep track of those.
    this.nudgeCachedObjects(x, y);

    // Commit the changes to the canvas
    this.commitPoints();

    // Also nudge the virgin shape if there is one
    return (this.virgin != null ? this.virgin.nudge(x, y) : undefined);
  }


  rotate(a, origin) {
    // Add to the transform angle we're keeping track of.
    if (origin == null) { origin = this.center(); }
    this.metadata.angle += a;

    // Normalize it to be 0 <= n <= 360
    this.metadata.angle %= 360;

    // At this point the bounds are no longer valid, so ditch it.
    this.clearCachedObjects();

    // Rotate all the points!
    this.points.map(p => p.rotate(a, origin));

    // Commit it
    this.commitPoints();
  }

  getPoints() {
    return this.points.all();
  }

  fitToBounds(bounds) {
    this.clearCachedObjects();
    let mb = this.bounds();
    // Make up for the difference

    let myWidth = mb.width;
    let myHeight = mb.height;

    let sx = bounds.width / mb.width;
    let sy = bounds.height / mb.height;

    if ((isNaN(sx)) || (sx === Infinity) || (sx === -Infinity) || (sx === 0)) { sx = 1; }
    if ((isNaN(sy)) || (sy === Infinity) || (sy === -Infinity) || (sy === 0)) { sy = 1; }

    sx = Math.max(1e-5, sx);
    sy = Math.max(1e-5, sy);

    this.scale(sx, sy, new Posn(mb.x, mb.y));
    return this.nudge(bounds.x - mb.x, mb.y - bounds.y);
  }

  drawToCanvas(context, projection) {
    context.beginPath();
    for (let point of Array.from(this.points.all())) {
      switch (point.constructor) {
        case MoveTo:
          context.moveTo(projection.x(point.x), projection.y(point.y));
          break;
        case LineTo:
          context.lineTo(projection.x(point.x), projection.y(point.y));
          break;
        case CurveTo:
          context.bezierCurveTo(projection.x(point.x2), projection.y(point.y2), projection.x(point.x3), projection.y(point.y3), projection.x(point.x), projection.y(point.y));
          break;
      }
    }
    return this.finishToCanvas(context, projection);
  }
}
Path.initClass();


function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
