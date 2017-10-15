import proto from 'proto/schema';
import math from 'lib/math';

/*

  Posn

    •
      (x, y)


  Lowest-level geometry class.

  Consists of x, y coordinates. Provides methods for manipulating or representing
  the point in two-dimensional space.

  Superclass: Point

*/

export default class Posn {
  constructor(x1, y1) {
    // I/P:
    //   x: number
    //   y: number
    //
    //     OR
    //
    //   e: Event object with clientX and clientY values

    this.x = x1;
    this.y = y1;
    if (this.x instanceof Object) {
      // Support for providing an Event object as the only arg.
      // Reads the clientX and clientY values
      if (this.x.clientX != null && this.x.clientY != null) {
        this.y = this.x.offsetY;
        this.x = this.x.offsetX;
      } else if (this.x.left != null && this.x.top != null) {
        this.y = this.x.top;
        this.x = this.x.left;
      } else if (this.x.x != null && this.x.y != null) {
        this.y = this.x.y;
        this.x = this.x.x;
      }
    } else if (typeof this.x === 'string' && this.x.mentions(',')) {
      // Support for giving a string of two numbers and a comma "12.3,840"
      let split = this.x.split(',').map(parseFloat);
      let x = split[0];
      let y = split[1];
      this.x = x;
      this.y = y;
    }
  }

  // Rounding an you know

  toString() {
    return `${this.x},${this.y}`;
  }

  toShortString() {
    return `${math.fmtFloat(this.x, 4)},${math.fmtFloat(this.y, 4)}`;
  }

  toFixed(n) {
    return `${this.x.toFixed(n)},${this.y.toFixed(n)}`;
  }

  toJSON() {
    return {
      x: this.x,
      y: this.y
    };
  }

  toProto() {
    return proto.geometry.Posn.fromObject(this.toJSON());
  }

  static fromProto(posn) {
    return new Posn({ x: posn.x, y: posn.y });
  }

  nudge(x, y) {
    this.x += x;
    this.y += y;
    return this;
  }

  lerp(b, factor) {
    return new Posn(
      this.x + (b.x - this.x) * factor,
      this.y + (b.y - this.y) * factor
    );
  }

  gte(p) {
    return this.x >= p.x && this.y >= p.y;
  }

  lte(p) {
    return this.x <= p.x && this.y <= p.y;
  }

  directionRelativeTo(p) {
    return `${this.y < p.y ? 't' : this.y > p.y ? 'b' : ''}${this.x < p.x
      ? 'l'
      : this.x > p.x ? 'r' : ''}`;
  }

  squareUpAgainst(p) {
    // Takes another posn as an anchor, and nudges this one
    // so that it's on the nearest 45° going off of the anchor posn.

    let xDiff = Math.abs(this.x - p.x);
    let yDiff = Math.abs(this.y - p.y);
    let direction = this.directionRelativeTo(p);

    if (xDiff === 0 && yDiff === 0) {
      return p;
    }

    switch (direction) {
      case 'tl':
        if (xDiff < yDiff) {
          this.nudge(xDiff - yDiff, 0);
        } else if (yDiff < xDiff) {
          this.nudge(0, xDiff - yDiff, 0);
        }
        break;
      case 'tr':
        if (xDiff < yDiff) {
          this.nudge(yDiff - xDiff, 0);
        } else if (yDiff < xDiff) {
          this.nudge(0, xDiff - yDiff);
        }
        break;
      case 'br':
        if (xDiff < yDiff) {
          this.nudge(yDiff - xDiff, 0);
        } else if (yDiff < xDiff) {
          this.nudge(0, yDiff - xDiff);
        }
        break;
      case 'bl':
        if (xDiff < yDiff) {
          this.nudge(xDiff - yDiff, 0);
        } else if (yDiff < xDiff) {
          this.nudge(0, yDiff - xDiff);
        }
        break;
      case 't':
      case 'b':
        this.nudge(yDiff, 0);
        break;
      case 'r':
      case 'l':
        this.nudge(0, xDiff);
        break;
    }
    return this;
  }

  equal(p) {
    return this.x === p.x && this.y === p.y;
  }

  min(p) {
    return new Posn(Math.min(this.x, p.x), Math.min(this.y, p.y));
  }

  max(p) {
    return new Posn(Math.max(this.x, p.x), Math.max(this.y, p.y));
  }

  angle360(base) {
    let a = 90 - new LineSegment(base, this).angle;
    return a + (this.x < base.x ? 180 : 0);
  }

  rotate(angle, origin) {
    if (angle === 0) return this;

    if (origin == null) {
      origin = new Posn(0, 0);
    }
    if (origin.equal(this)) {
      return this;
    }

    angle *= Math.PI / 180;

    // Normalize the point on the origin.
    this.x -= origin.x;
    this.y -= origin.y;

    let x = this.x * Math.cos(angle) - this.y * Math.sin(angle);
    let y = this.x * Math.sin(angle) + this.y * Math.cos(angle);

    // Move points back to where they were.
    this.x = x + origin.x;
    this.y = y + origin.y;

    return this;
  }

  scale(x, y, origin) {
    if (origin == null) {
      origin = new Posn(0, 0);
    }
    this.x += (this.x - origin.x) * (x - 1);
    this.y += (this.y - origin.y) * (y - 1);
    return this;
  }

  matrix(a, b, c, d, e, f) {
    this.x = a * this.x + c * this.y + e;
    this.y = b * this.x + d * this.y + f;
  }

  sharp() {
    return new Posn(math.sharpen(this.x), math.sharpen(this.y));
  }

  copy(p) {
    this.x = p.x;
    return (this.y = p.y);
  }

  clone() {
    return new Posn(this.x, this.y);
  }

  snap(to, threshold) {
    // Algorithm: bisect the line on this posn's x and y
    // coordinates and return the midpoint of that line.
    if (threshold == null) {
      threshold = Math.INFINITY;
    }
    let perpLine = this.verti(10000);
    perpLine.rotate(to.angle360() + 90, this);
    return perpLine.intersection(to);
  }

  reflect(posn) {
    let { x, y } = posn;
    return new Posn(x + (x - this.x), y + (y - this.y));
  }

  distanceFrom(b) {
    return Math.sqrt(Math.pow(b.x - this.x, 2) + Math.pow(b.y - this.y, 2));
  }

  perpendicularDistanceFrom(ls) {
    let ray = this.verti(1e5);
    ray.rotate(ls.angle360() + 90, this);
    //ui.annotations.drawLine(ray.a, ray.b)
    let inter = ray.intersection(ls);
    if (inter != null) {
      ls = new LineSegment(this, inter);
      let len = ls.length;
      return [len, inter, ls];
    } else {
      return null;
    }
  }

  multiplyBy(s) {
    switch (typeof s) {
      case 'number':
        let np = this.clone();
        np.x *= s;
        np.y *= s;
        return np;
      case 'object':
        np = this.clone();
        np.x *= s.x;
        np.y *= s.y;
        return np;
    }
  }

  multiplyByMutable(s) {
    this.x *= s;
    this.y *= s;

    if (this.x2 != null) {
      this.x2 *= s;
      this.y2 *= s;
    }

    if (this.x3 != null) {
      this.x3 *= s;
      return (this.y3 *= s);
    }
  }

  add(s) {
    switch (typeof s) {
      case 'number':
        return new Posn(this.x + s, this.y + s);
      case 'object':
        return new Posn(this.x + s.x, this.y + s.y);
    }
  }

  subtract(s) {
    switch (typeof s) {
      case 'number':
        return new Posn(this.x - s, this.y - s);
      case 'object':
        return new Posn(this.x - s.x, this.y - s.y);
    }
  }

  setPrec(prec) {
    this.prec = prec;
  }

  setSucc(succ) {
    this.succ = succ;
  }

  /*
      I love you artur
      hackerkate nows the sick code
  */

  inRanges(xr, yr) {
    return xr.contains(this.x && yr.contains(this.y));
  }

  inRangesInclusive(xr, yr) {
    return xr.containsInclusive(this.x) && yr.containsInclusive(this.y);
  }

  verti(ln) {
    return new LineSegment(
      this.clone().nudge(0, -ln),
      this.clone().nudge(0, ln)
    );
  }

  insideOf(shape) {
    return false;
  }

  dot(v) {
    return this.x * v.x + this.y * v.y;
  }

  within(posn, tolerance) {
    return this.distanceFrom(posn) <= tolerance;
  }

  parseInt() {
    this.x = parseInt(this.x, 10);
    this.y = parseInt(this.y, 10);
  }

  delta(op) {
    return {
      x: this.x - op.x,
      y: this.y - op.y
    };
  }
}

Posn.fromJSON = json => new Posn(json.x, json.y);
