import math from 'lib/math';
import Posn from 'geometry/posn';
import LineSegment from 'geometry/line-segment';
import Range from 'geometry/range';

export default class Bounds {
  constructor(x1, y1, width, height, angle = 0) {
    this.angle = angle;
    if (x1 instanceof Array) {
      // A list of bounds
      return Bounds.fromBounds(x1);
    } else {
      let x, y;
      this.x = x1;
      this.y = y1;
      this.x2 = this.x + width;
      this.y2 = this.y + height;
    }

    this.xr = new Range(this.x, this.x + width);
    this.yr = new Range(this.y, this.y + height);
  }

  get l() {
    return Math.min(this.x, this.x2);
  }
  get r() {
    return Math.max(this.x, this.x2);
  }
  get t() {
    return Math.min(this.y, this.y2);
  }
  get b() {
    return Math.max(this.y, this.y2);
  }

  get width() {
    return this.r - this.l;
  }

  get height() {
    return this.b - this.t;
  }

  equal(ob) {
    return (
      this.t === ob.t && this.l === ob.l && this.r === ob.r && this.b === ob.b
    );
  }

  static fromPosns(posns) {
    let xs = posns.map(p => {
      return p.x;
    });
    let ys = posns.map(p => {
      return p.y;
    });
    let minX = Math.min(...xs);
    let minY = Math.min(...ys);
    let maxX = Math.max(...xs);
    let maxY = Math.max(...ys);

    return new Bounds(minX, minY, maxX - minX, maxY - minY);
  }

  static fromBounds(bounds) {
    let pss = bounds.reduce((a, b) => {
      return a.concat([b.tl(), b.tr(), b.br(), b.bl()]);
    }, []);

    return Bounds.fromPosns(pss);

    let x = Math.min.apply(this, bounds.map(b => b.x));
    let y = Math.min.apply(this, bounds.map(b => b.y));
    let x2 = Math.max.apply(this, bounds.map(b => b.x2));
    let y2 = Math.max.apply(this, bounds.map(b => b.y2));
    return new Bounds(x, y, x2 - x, y2 - y);
  }

  static fromRanges(xrs, yrs) {
    return new Bounds(xrs.min, yrs.min, xrs.length, yrs.length);
  }

  static forLineSegment(ls) {
    return this.fromRanges(ls.xRange(), ls.yRange());
  }

  sharp() {
    return new Bounds(
      math.sharpen(this.x),
      math.sharpen(this.y),
      Math.round(this.width),
      Math.round(this.height)
    );
  }

  // Corners
  tl() {
    return new Posn(this.l, this.t).rotate(this.angle, this.center());
  }
  tr() {
    return new Posn(this.r, this.t).rotate(this.angle, this.center());
  }
  br() {
    return new Posn(this.r, this.b).rotate(this.angle, this.center());
  }
  bl() {
    return new Posn(this.l, this.b).rotate(this.angle, this.center());
  }

  // Middles
  tm() {
    return new Posn(this.l + this.width / 2, this.t).rotate(
      this.angle,
      this.center()
    );
  }
  bm() {
    return new Posn(this.l + this.width / 2, this.b).rotate(
      this.angle,
      this.center()
    );
  }
  rm() {
    return new Posn(this.r, this.t + this.height / 2).rotate(
      this.angle,
      this.center()
    );
  }
  lm() {
    return new Posn(this.l, this.t + this.height / 2).rotate(
      this.angle,
      this.center()
    );
  }

  transform(x, y, z) {
    return new Bounds(
      x(this.x),
      y(this.y),
      z(this.width),
      z(this.height),
      this.angle
    );
  }

  clone() {
    return new Bounds(this.x, this.y, this.width, this.height, this.angle);
  }

  center() {
    return new Posn(this.x + this.width / 2, this.y + this.height / 2);
  }

  points() {
    return [
      new Posn(this.x, this.y),
      new Posn(this.x2, this.y),
      new Posn(this.x2, this.y2),
      new Posn(this.x, this.y2)
    ];
  }

  contains(posn, tolerance = null) {
    return (
      this.xr.containsInclusive(posn.x, tolerance) &&
      this.yr.containsInclusive(posn.y, tolerance)
    );
  }

  overlapsBounds(other, recur) {
    if (recur == null) {
      recur = true;
    }
    return this.toRect().overlaps(other.toRect());
  }

  nudge(x, y) {
    this.x += x;
    this.x2 += x;
    this.y += y;
    this.y2 += y;
    this.xr.nudge(x);
    return this.yr.nudge(y);
  }

  scale(x, y, origin) {
    let tl = this.tl();
    let br = this.br();
    tl.scale(x, y, origin);
    br.scale(x, y, origin);

    this.x = tl.x;
    this.y = tl.y;
    this.x2 = br.x;
    this.y2 = br.y;

    if (isNaN(this.x)) {
      debugger;
    }

    this.xr.scale(x, origin);
    this.yr.scale(y, origin);

    return this;
  }

  rotate(angle, origin) {
    let center = this.center();
    center.rotate(angle, origin);
    let nb = new Bounds(this.l, this.t, this.width, this.height, angle);
    nb.centerOn(center);
    return nb;
  }

  padded(n) {
    return new Bounds(
      this.l - n,
      this.t - n,
      this.width + n * 2,
      this.height + n * 2,
      this.angle
    );
  }

  squareSmaller(anchor) {
    if (this.width < this.height) {
      return (this.height = this.width);
    } else {
      return (this.width = this.height);
    }
  }

  centerOn(posn) {
    let offset = posn.subtract(this.center());
    return this.nudge(offset.x, offset.y);
  }

  fitTo(bounds) {
    let sw = this.width / bounds.width;
    let sh = this.height / bounds.height;
    let sm = Math.max(sw, sh);
    return new Bounds(0, 0, this.width / sm, this.height / sm);
  }

  fitToDimension(d) {
    return this.fitTo(new Bounds(0, 0, d, d));
  }

  fitToDimensions(w, h) {
    return this.fitTo(new Bounds(0, 0, w, h));
  }

  static centeredOnPosn(posn, w, h) {
    return new Bounds(posn.x - w / 2, posn.y - h / 2, w, h);
  }

  lineSegments() {
    return [
      new LineSegment(this.tl(), this.tr()),
      new LineSegment(this.tr(), this.br()),
      new LineSegment(this.br(), this.bl()),
      new LineSegment(this.bl(), this.tl())
    ];
  }

  moveEdge(edge, amount) {
    switch (edge) {
      case 't':
        if (this.y < this.y2) {
          this.y += amount;
        } else {
          this.y2 += amount;
        }
        break;
      case 'b':
        if (this.y > this.y2) {
          this.y += amount;
        } else {
          this.y2 += amount;
        }
        break;
      case 'l':
        if (this.x < this.x2) {
          this.x += amount;
        } else {
          this.x2 += amount;
        }
        break;
      case 'r':
        if (this.x > this.x2) {
          this.x += amount;
        } else {
          this.x2 += amount;
        }
        break;
    }
    return this;
  }

  flipped(axis) {
    switch (axis) {
      case 'x':
        return this.x2 < this.x;
      case 'y':
        return this.y2 < this.y;
    }
  }

  unflip() {
    if (this.flipped('x')) {
      let { x, x2 } = this;
      this.x = x2;
      this.x2 = x;
    }
    if (this.flipped('y')) {
      let { y, y2 } = this;
      this.y = y2;
      this.y2 = y;
    }
  }
}
