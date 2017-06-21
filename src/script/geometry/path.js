import Item from 'geometry/item'
import PointsSegment from 'geometry/points-segment'
import PointsList from 'geometry/points-list'
import Range from 'geometry/range'
import lab from 'lab/lab'
import PathPoint from 'geometry/path-point';
import Posn from 'geometry/posn';

export default class Path extends Item {
  static initClass() {
    this.prototype.type = 'path';
  
    // Caching expensive metadata
    this.prototype.caching = true;
  }

  constructor(data) {
    super(data);
    if (this.data && this.data.d) {
      this.importNewPoints(this.data.d);
    }
  }

  // Constructors
  static rectangle(data) {
    let { x, y, w, h } = data;

    let segment = new PointsSegment([
      new PathPoint(x,y),
      new PathPoint(x+w,y),
      new PathPoint(x+w,y+h),
      new PathPoint(x,y+h),
    ]);
    segment.close();

    // Replace attrs with d attr
    data.d = new PointsList([segment]);
    delete data.x;
    delete data.y;
    delete data.w;
    delete data.h;

    return new Path(data);
  }

  static ellipse(data) {
    let { cx, cy, rx, ry } = data;

    let t = new Posn(cx, cy - ry);
    let r = new Posn(cx + rx, cy);
    let b = new Posn(cx, cy + ry);
    let l = new Posn(cx - rx, cy);

    let ky = Math.KAPPA * ry;
    let kx = Math.KAPPA * rx;

    let segment = new PointsSegment([
      new PathPoint(r.x, r.y, r.x, r.y - ky, r.x, r.y + ky),
      new PathPoint(b.x, b.y, b.x + kx, b.y, b.x - kx, b.y),
      new PathPoint(l.x, l.y, l.x, l.y + ky, l.x, l.y - ky),
      new PathPoint(t.x, t.y, t.x - kx, t.y, t.x + kx, t.y),
    ]);
    segment.close();

    data.d = new PointsList([segment]);
    delete data.cx;
    delete data.cy;
    delete data.rx;
    delete data.ry;

    return new Path(data);
  }

  static polyline(data) {
    let segment = new PointsSegment(
      data.points.split(' ').map((p,i) => {
        let parts = p.split(',');
        let x = parseFloat(parts[0]);
        let y = parseFloat(parts[1]);
        return new PathPoint(x, y);
      })
    );

    data.d = new PointsList([segment]);
    delete data.points;

    return new Path(data);
  }

  static polygon(data) {
    let path = Path.polyline(data);
    path.points.segments[0].close();
    return path;
  }

  importNewPoints(points) {
    if (points instanceof PointsList) {
      this.points = points;
      points.path = this;
    } else if (typeof(points) === 'string') {
      this.points = PointsList.fromString(points, this);
    }

    this.clearCachedObjects();

    return this;
  }

  child(i) {
    return this.points.segments[i];
  }

  get empty() {
    return this.points.empty;
  }

  remove(item) {
    if (item instanceof PointsSegment) {
      this.points.removeSegment(item);
    }
  }

  insert(segment, index) {
    this.points.insert(segment, index);
  }

  nudgeCachedObjects(x, y) {
    if (this.boundsCached != null) {
      this.boundsCached.nudge(x, y);
    }
  }

  scaleCachedObjects(x, y, origin) {
    if (this.boundsCached != null) {
      this.boundsCached.scale(x, y, origin);
    }
  }

  clearCachedObjects() {
    this.boundsCached = null;
    return this;
  }

  lineSegments() {
    // No I/P
    //
    // O/P: A list of LineSegments and/or CubicBeziers representing this path
    let ls = this.points.segments.reduce((a, b) => {
      return a.concat(b.lineSegments());
    }, []);
    return ls;
  }

  getRanges() {
    let lineSegments = this.lineSegments();

    let xrs = Range.fromList(lineSegments.map((ls) => {
      return ls.xRange();
    }));
    let yrs = Range.fromList(lineSegments.map((ls) => {
      return ls.yRange();
    }));
    return { xrs, yrs }
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
  }


  nudge(x, y) {
    // Nudge
    this.points.map(p => p.nudge(x, y));

    // Nudge the cached bounds and line segments if they're there
    // to keep track of those.
    this.nudgeCachedObjects(x, y);
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

  drawToCanvas(layer, context, projection) {
    context.beginPath();
    for (let segment of this.points.segments) {
      segment.drawToCanvas(layer, context, projection);
    }
    this.finishToCanvas(context, projection);
  }
}
Path.initClass();


function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
