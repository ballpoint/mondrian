import math from 'lib/math';
import Posn from 'geometry/posn';
import Range from 'geometry/range';
import Rect from 'geometry/rectangle';

export default class Bounds {

  constructor(x1, y1, width, height) {
    let x, y;
    this.x = x1;
    this.y = y1;
    this.width = width;
    this.height = height;
    if (this.x instanceof Array) {
      // A list of bounds
      let minX = Math.min.apply(this, this.x.map(b => b.x));
      this.y   = Math.min.apply(this, this.x.map(b => b.y));
      this.x2  = Math.max.apply(this, this.x.map(b => b.x2));
      this.y2  = Math.max.apply(this, this.x.map(b => b.y2));
      this.x   = minX;
      this.width  = this.x2 - this.x;
      this.height = this.y2 - this.y;
    } else if (this.x instanceof Posn && this.y instanceof Posn) {
      // A pair of posns

      x = Math.min(this.x.x, this.y.x);
      y = Math.min(this.x.y, this.y.y);
      this.x2 = Math.max(this.x.x, this.y.x);
      this.y2 = Math.max(this.x.y, this.y.y);
      this.x = x;
      this.y = y;
      this.width = this.x2 - this.x;
      this.height = this.y2 - this.y;

    } else {
      this.x2 = this.x + this.width;
      this.y2 = this.y + this.height;
    }

    this.xr = new Range(this.x, this.x + this.width);
    this.yr = new Range(this.y, this.y + this.height);
  }

  static fromPosns(posns) {
    let xs = posns.map((p) => { return p.x });
    let ys = posns.map((p) => { return p.y });
    let minX = Math.min(...xs);
    let minY = Math.min(...ys);
    let maxX = Math.max(...xs);
    let maxY = Math.max(...ys);

    return new Bounds(minX, minY, maxX - minX, maxY - minY);
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
  tl() { return new Posn(this.x, this.y); }
  tr() { return new Posn(this.x2, this.y); }
  br() { return new Posn(this.x2, this.y2); }
  bl() { return new Posn(this.x, this.y2); }

  // Middles
  tm() { return new Posn(this.x+((this.x2-this.x)/2), this.y); }
  bm() { return new Posn(this.x+((this.x2-this.x)/2), this.y2); }
  rm() { return new Posn(this.x2, this.y+((this.y2-this.y)/2)); }
  lm() { return new Posn(this.x, this.y+((this.y2-this.y)/2)); }

  transform(x, y, z) {
    return new Bounds(x(this.x), y(this.y), z(this.width), z(this.height));
  }

  clone() { return new Bounds(this.x, this.y, this.width, this.height); }

  toRect() {
    return new Rect({
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    });
  }

  center() {
    return new Posn(this.x + (this.width / 2), this.y + (this.height / 2));
  }

  points() { return [new Posn(this.x, this.y), new Posn(this.x2, this.y), new Posn(this.x2, this.y2), new Posn(this.x, this.y2)]; }

  contains(posn, tolerance=null) {
    return this.xr.containsInclusive(posn.x, tolerance) && this.yr.containsInclusive(posn.y, tolerance);
  }

  overlapsBounds(other, recur) {
    if (recur == null) { recur = true; }
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
    let tl = new Posn(this.x, this.y);
    let br = new Posn(this.x2, this.y2);
    tl.scale(x, y, origin);
    br.scale(x, y, origin);

    this.x = tl.x;
    this.y = tl.y;
    this.x2 = br.x;
    this.y2 = br.y;

    this.width *= x;
    this.height *= y;

    this.xr.scale(x, origin);
    this.yr.scale(y, origin);

    return this;
  }

  padded(n) {
    return new Bounds(this.x - n, this.y - n, this.width + (n*2), this.height + (n*2))
  }

  squareSmaller(anchor) {
    if (this.width < this.height) {
      return this.height = this.width;
    } else {
      return this.width = this.height;
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

  static centeredOnPosn(posn, w, h) {
    return new Bounds(posn.x-(w/2), posn.y-(h/2), w, h);
  }

  adjustElemsTo(bounds) {
    // Returns a method that can run on Monsvg objects
    // that will nudge and scale them so they go from these bounds
    // to look proportionately the same in the given bounds.
    let offset = this.tl().subtract(bounds.tl());
    let sw = this.width / bounds.width;
    let sh = this.height / bounds.height;
    // Return a function that will adjust a given element to the canvas
    return function(elem) {
      elem.scale(1/sw, 1/sh, bounds.tl());
      return elem.nudge(-offset.x, -offset.y);
    };
  }

  lineSegments() {
    return [
      new LineSegment(this.tl(), this.tr()),
      new LineSegment(this.tr(), this.br()),
      new LineSegment(this.br(), this.bl()),
      new LineSegment(this.bl(), this.tl()),
    ];
  }

  moveEdge(edge, amount) {
    switch (edge) {
      case 't':
        this.y += amount;
        this.height -= amount;
        return this;
      case 'b':
        this.y2 += amount;
        this.height += amount;
        return this;
      case 'l':
        this.x += amount;
        this.width -= amount;
        return this;
      case 'r':
        this.x2 += amount;
        this.width += amount;
        return this;
    }
    return this;
  }


}

