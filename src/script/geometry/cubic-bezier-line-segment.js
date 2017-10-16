import Range from 'geometry/range';
import Posn from 'geometry/posn';
import LineSegment from 'geometry/line-segment';
import Bounds from 'geometry/bounds';

const EPSILON = 1e-12;

const CURVETIME_EPSILON = 1e-8;

/*
  Internal representation of a cubic bezier line segment

  p1                                     p4
   o                                     o
    \\                                 //
     \\                               //
      \ \                           / /
       \   \                     /   /
        \     _               _     /
         \      __         __      /
          °       --_____--       °
           p2                    p3

  I/P:
    p1: First absolute point, the moveto
    p2: The first point's curve handle
    p3: The second point's curve handle
    p4: The second absolute point

    In context with syntax: M[p1]C[p2] [p3] [p4]

*/

export default class CubicBezier {
  static initClass() {
    this.prototype.boundsCached = undefined;
  }

  constructor(p1, p2, p3, p4) {
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
    this.p4 = p4;
  }

  static fromPathPoint(point, prec) {
    if (!prec) prec = point.prec;
    return new CubicBezier(
      prec.toPosn(),
      prec.getSHandle(),
      point.getPHandle(),
      point.toPosn()
    );
  }

  /*
  toString: ->
    "(Cubic bezier: #{@p1},#{@p2},#{@p3},#{@p4})"
  */

  toString() {
    return `${this.p1}, ${this.p2}, ${this.p3}, ${this.p4}`;
  }

  length() {
    // Not that accurate lol
    return this.intoLineSegments(4).reduce((a, b) => a + b.length);
  }

  beginning() {
    return this.p1;
  }

  end() {
    return this.p4;
  }

  nudge(x, y) {
    this.p1.nudge(x, y);
    this.p2.nudge(x, y);
    this.p3.nudge(x, y);
    this.p4.nudge(x, y);
    return this;
  }

  scale(x, y, origin) {
    this.p1.scale(x, y, origin);
    this.p2.scale(x, y, origin);
    this.p3.scale(x, y, origin);
    this.p4.scale(x, y, origin);
    return this;
  }

  rotate(angle, origin) {
    this.p1.rotate(angle, origin);
    this.p2.rotate(angle, origin);
    this.p3.rotate(angle, origin);
    this.p4.rotate(angle, origin);
    return this;
  }

  reverse() {
    // Note: this makes it lose its source
    return new CubicBezier(this.p4, this.p3, this.p2, this.p1);
  }

  equal(cbls) {
    if (cbls instanceof LineSegment) {
      return false;
    }
    return (
      (this.p1.equal(cbls.p1) &&
        this.p2.equal(cbls.p2) &&
        this.p3.equal(cbls.p3) &&
        this.p4.equal(cbls.p4)) ||
      (this.p1.equal(cbls.p4) &&
        this.p2.equal(cbls.p3) &&
        this.p3.equal(cbls.p2) &&
        this.p4.equal(cbls.p1))
    );
  }

  intersects(other) {
    let inter = this.intersection(other);
    return (
      inter instanceof Posn || (inter instanceof Array && inter.length > 0)
    );
  }

  intersection(other) {
    switch (other.constructor) {
      case LineSegment:
        return this.intersectionWithLineSegment(other);
      case CubicBezier:
        return this.intersectionWithCubicBezier(other);
    }
  }

  xRange() {
    return this.bounds().xr;
  }

  yRange() {
    return this.bounds().yr;
  }

  ends() {
    return [this.p1, this.p4];
  }

  nearestPercTo(posn) {
    let nearestPerc;
    let nearestDist = Infinity;

    for (let i = 0; i < 100; i++) {
      let p = this.posnAt(1 / i);
    }
  }

  posnAt(perc) {
    let result = this.splitAt(perc);
    return result[0].p4;
  }

  midPoint() {
    return this.posnAt(0.5);
  }

  bounds(useCached) {
    let height, maxy, miny, width;
    if (useCached == null) {
      useCached = false;
    }
    if (this.boundsCached != null && useCached) {
      return this.boundsCached;
    }

    let minx = (miny = Infinity);
    let maxx = (maxy = -Infinity);

    let top2x = this.p2.x - this.p1.x;
    let top2y = this.p2.y - this.p1.y;
    let top3x = this.p3.x - this.p2.x;
    let top3y = this.p3.y - this.p2.y;
    let top4x = this.p4.x - this.p3.x;
    let top4y = this.p4.y - this.p3.y;

    for (let i = 0; i <= 40; i++) {
      let d = i / 40;
      let px = this.p1.x + d * top2x;
      let py = this.p1.y + d * top2y;
      let qx = this.p2.x + d * top3x;
      let qy = this.p2.y + d * top3y;
      let rx = this.p3.x + d * top4x;
      let ry = this.p3.y + d * top4y;

      let toqx = qx - px;
      let toqy = qy - py;
      let torx = rx - qx;
      let tory = ry - qy;

      let sx = px + d * toqx;
      let sy = py + d * toqy;
      let tx = qx + d * torx;
      let ty = qy + d * tory;

      let totx = tx - sx;
      let toty = ty - sy;

      let x = sx + d * totx;
      let y = sy + d * toty;

      minx = Math.min(minx, x);
      miny = Math.min(miny, y);
      maxx = Math.max(maxx, x);
      maxy = Math.max(maxy, y);

      width = maxx - minx;
      height = maxy - miny;
    }

    // Cache the bounds and return them at the same time

    return (this.boundsCached = new Bounds(minx, miny, width, height));
  }

  intoLineSegments(n) {
    // Given n, split the bezier into n consecutive LineSegments, returned in an Array
    //
    // I/P: n, number
    // O/P: [LineSegment, LineSegment, LineSegment...] array

    let segments = [];
    for (
      let m = 0, end = n, asc = 0 <= end;
      asc ? m <= end : m >= end;
      asc ? m++ : m--
    ) {
      var last;
      let i = 1 / m;
      let x =
        Math.pow(1 - i, 3) * this.p1.x +
        3 * Math.pow(1 - i, 2) * i * this.p2.x +
        3 * (1 - i) * Math.pow(i, 2) * this.p3.x +
        Math.pow(i, 3) * this.p4.x;
      let y =
        Math.pow(1 - i, 3) * this.p1.y +
        3 * Math.pow(1 - i, 2) * i * this.p2.y +
        3 * (1 - i) * Math.pow(i, 2) * this.p3.y +
        Math.pow(i, 3) * this.p4.y;
      if (m % 2 === 0) {
        last = new Posn(x, y);
      } else {
        segments.push(new LineSegment(last, new Posn(x, y)));
      }
    }
    return segments.splice(1);
  }

  splitAt(t, force) {
    // Given a float t between 0 and 1, return two CubicBeziers that result from splitting this one at that percentage in.
    //
    // I/P: t, number between 0 and 1
    // O/P: [CubicBezier, CubicBezier] array
    //
    // Uses de Casteljau's algorithm. Really damn good resources:
    //   http://processingjs.nihongoresources.com/bezierinfo/
    //   http://en.wikipedia.org/wiki/De_Casteljau's_algorithm
    //
    // Example, splitting in half:
    // t = 0.5
    // p1: (10,10),    p2: (20, 5),    p3: (40, 20), p4: (50, 10)
    // p5: (15, 7.5),  p6: (30, 12.5), p7: (45, 15)
    // p8: (22.5, 10), p9: (37.5, 13.75)
    // p10: (30, 11.875)
    //
    // The split will happen at exactly p10, so the resulting curves will end and start there, respectively.
    // The resulting curves will be
    // [new CubicBezier(p1, p5, p8, p10), new CubicBezier(p10, p9, p7, p4)]

    if (typeof t === 'number') {
      let p5 = new LineSegment(this.p1, this.p2).posnAt(t);
      let p6 = new LineSegment(this.p2, this.p3).posnAt(t);
      let p7 = new LineSegment(this.p3, this.p4).posnAt(t);
      let p8 = new LineSegment(p5, p6).posnAt(t);
      let p9 = new LineSegment(p6, p7).posnAt(t);
      let p10 = new LineSegment(p8, p9).posnAt(t);

      if (force) {
        p10 = force;
      }

      return [
        new CubicBezier(this.p1, p5, p8, p10),
        new CubicBezier(p10, p9, p7, this.p4)
      ];
    } else if (t instanceof Posn) {
      // Given a single Posn, find its percentage and then split the line on it.
      return this.splitAt(this.findPercentageOfPosn(t), t);
    }
  }

  findPercentageOfPosn(posn) {
    let count = 100;
    let minDist = Infinity;
    let minPerc = 0;

    let refine = t => {
      if (t >= 0 && t <= 1) {
        var dist = posn.distanceFrom(this.posnAt(t), true);
        if (dist < minDist) {
          minDist = dist;
          minPerc = t;
          return true;
        }
      }
    };

    for (var i = 0; i <= count; i++) refine(i / count);

    // Now iteratively refine solution until we reach desired precision.
    var step = 1 / (count * 2);
    while (step > CURVETIME_EPSILON) {
      if (!refine(minPerc - step) && !refine(minPerc + step)) step /= 2;
    }
    return minPerc;
  }

  closestPosn(posn) {
    let perc = this.findPercentageOfPosn(posn);
    return this.posnAt(perc);
  }

  isIncident(posn) {
    return this.closestPosn(posn).within(posn, 0.001);
  }

  /*

    Intersection methods

  */

  intersectionWithLineSegment(l) {
    /*

      Given a LineSegment, lists intersection point(s).

      I/P: LineSegment
      O/P: Array of Posns

      I am a cute sick Kate Whiper Snapper
      i love monodebe and I learn all about the flexible scemless data base

      Disclaimer: I don't really understand this but it passes my tests.

    */

    let min = l.a.min(l.b);
    let max = l.a.max(l.b);

    let results = [];

    let a = this.p1.multiplyBy(-1);
    let b = this.p2.multiplyBy(3);
    let c = this.p3.multiplyBy(-3);
    let d = a.add(b.add(c.add(this.p4)));
    let c3 = new Posn(d.x, d.y);

    a = this.p1.multiplyBy(3);
    b = this.p2.multiplyBy(-6);
    c = this.p3.multiplyBy(3);
    d = a.add(b.add(c));
    let c2 = new Posn(d.x, d.y);

    a = this.p1.multiplyBy(-3);
    b = this.p2.multiplyBy(3);
    c = a.add(b);
    let c1 = new Posn(c.x, c.y);

    let c0 = new Posn(this.p1.x, this.p1.y);

    let n = new Posn(l.a.y - l.b.y, l.b.x - l.a.x);

    let cl = l.a.x * l.b.y - l.b.x * l.a.y;

    let roots = new Polynomial([
      n.dot(c3),
      n.dot(c2),
      n.dot(c1),
      n.dot(c0) + cl
    ]).roots();

    for (let i in roots) {
      let t = roots[i];
      if (0 <= t && t <= 1) {
        let p5 = this.p1.lerp(this.p2, t);
        let p6 = this.p2.lerp(this.p3, t);
        let p7 = this.p3.lerp(this.p4, t);
        let p8 = p5.lerp(p6, t);
        let p9 = p6.lerp(p7, t);
        let p10 = p8.lerp(p9, t);

        if (l.a.x === l.b.x) {
          if (min.y <= p10.y && p10.y <= max.y) {
            results.push(p10);
          }
        } else if (l.a.y === l.b.y) {
          if (min.x <= p10.x && p10.x <= max.x) {
            results.push(p10);
          }
        } else if (p10.gte(min) && p10.lte(max)) {
          results.push(p10);
        }
      }
    }

    return results;
  }

  intersectionWithCubicBezier(other) {
    // I don't know.
    //
    // I/P: Another CubicBezier
    // O/P: Array of Posns.
    //
    // Source: http://www.kevlindev.com/gui/math/intersection/index.htm#Anchor-intersectBezie-45477

    let results = [];

    let a = this.p1.multiplyBy(-1);
    let b = this.p2.multiplyBy(3);
    let c = this.p3.multiplyBy(-3);
    let d = a.add(b.add(c.add(this.p4)));
    let c13 = new Posn(d.x, d.y);

    a = this.p1.multiplyBy(3);
    b = this.p2.multiplyBy(-6);
    c = this.p3.multiplyBy(3);
    d = a.add(b.add(c));
    let c12 = new Posn(d.x, d.y);

    a = this.p1.multiplyBy(-3);
    b = this.p2.multiplyBy(3);
    c = a.add(b);
    let c11 = new Posn(c.x, c.y);

    let c10 = new Posn(this.p1.x, this.p1.y);

    a = other.p1.multiplyBy(-1);
    b = other.p2.multiplyBy(3);
    c = other.p3.multiplyBy(-3);
    d = a.add(b.add(c.add(other.p4)));
    let c23 = new Posn(d.x, d.y);

    a = other.p1.multiplyBy(3);
    b = other.p2.multiplyBy(-6);
    c = other.p3.multiplyBy(3);
    d = a.add(b.add(c));
    let c22 = new Posn(d.x, d.y);

    a = other.p1.multiplyBy(-3);
    b = other.p2.multiplyBy(3);
    c = a.add(b);
    let c21 = new Posn(c.x, c.y);

    let c20 = new Posn(other.p1.x, other.p1.y);

    let c10x2 = c10.x * c10.x;
    let c10x3 = c10.x * c10.x * c10.x;
    let c10y2 = c10.y * c10.y;
    let c10y3 = c10.y * c10.y * c10.y;
    let c11x2 = c11.x * c11.x;
    let c11x3 = c11.x * c11.x * c11.x;
    let c11y2 = c11.y * c11.y;
    let c11y3 = c11.y * c11.y * c11.y;
    let c12x2 = c12.x * c12.x;
    let c12x3 = c12.x * c12.x * c12.x;
    let c12y2 = c12.y * c12.y;
    let c12y3 = c12.y * c12.y * c12.y;
    let c13x2 = c13.x * c13.x;
    let c13x3 = c13.x * c13.x * c13.x;
    let c13y2 = c13.y * c13.y;
    let c13y3 = c13.y * c13.y * c13.y;
    let c20x2 = c20.x * c20.x;
    let c20x3 = c20.x * c20.x * c20.x;
    let c20y2 = c20.y * c20.y;
    let c20y3 = c20.y * c20.y * c20.y;
    let c21x2 = c21.x * c21.x;
    let c21x3 = c21.x * c21.x * c21.x;
    let c21y2 = c21.y * c21.y;
    let c22x2 = c22.x * c22.x;
    let c22x3 = c22.x * c22.x * c22.x;
    let c22y2 = c22.y * c22.y;
    let c23x2 = c23.x * c23.x;
    let c23x3 = c23.x * c23.x * c23.x;
    let c23y2 = c23.y * c23.y;
    let c23y3 = c23.y * c23.y * c23.y;

    let poly = new Polynomial([
      -c13x3 * c23y3 +
        c13y3 * c23x3 -
        3 * c13.x * c13y2 * c23x2 * c23.y +
        3 * c13x2 * c13.y * c23.x * c23y2,

      -6 * c13.x * c22.x * c13y2 * c23.x * c23.y +
        6 * c13x2 * c13.y * c22.y * c23.x * c23.y +
        3 * c22.x * c13y3 * c23x2 -
        3 * c13x3 * c22.y * c23y2 -
        3 * c13.x * c13y2 * c22.y * c23x2 +
        3 * c13x2 * c22.x * c13.y * c23y2,
      -6 * c21.x * c13.x * c13y2 * c23.x * c23.y -
        6 * c13.x * c22.x * c13y2 * c22.y * c23.x +
        6 * c13x2 * c22.x * c13.y * c22.y * c23.y +
        3 * c21.x * c13y3 * c23x2 +
        3 * c22x2 * c13y3 * c23.x +
        3 * c21.x * c13x2 * c13.y * c23y2 -
        3 * c13.x * c21.y * c13y2 * c23x2 -
        3 * c13.x * c22x2 * c13y2 * c23.y +
        c13x2 * c13.y * c23.x * (6 * c21.y * c23.y + 3 * c22y2) +
        c13x3 *
          (-c21.y * c23y2 -
            2 * c22y2 * c23.y -
            c23.y * (2 * c21.y * c23.y + c22y2)),

      c11.x * c12.y * c13.x * c13.y * c23.x * c23.y -
        c11.y * c12.x * c13.x * c13.y * c23.x * c23.y +
        6 * c21.x * c22.x * c13y3 * c23.x +
        3 * c11.x * c12.x * c13.x * c13.y * c23y2 +
        6 * c10.x * c13.x * c13y2 * c23.x * c23.y -
        3 * c11.x * c12.x * c13y2 * c23.x * c23.y -
        3 * c11.y * c12.y * c13.x * c13.y * c23x2 -
        6 * c10.y * c13x2 * c13.y * c23.x * c23.y -
        6 * c20.x * c13.x * c13y2 * c23.x * c23.y +
        3 * c11.y * c12.y * c13x2 * c23.x * c23.y -
        2 * c12.x * c12y2 * c13.x * c23.x * c23.y -
        6 * c21.x * c13.x * c22.x * c13y2 * c23.y -
        6 * c21.x * c13.x * c13y2 * c22.y * c23.x -
        6 * c13.x * c21.y * c22.x * c13y2 * c23.x +
        6 * c21.x * c13x2 * c13.y * c22.y * c23.y +
        2 * c12x2 * c12.y * c13.y * c23.x * c23.y +
        c22x3 * c13y3 -
        3 * c10.x * c13y3 * c23x2 +
        3 * c10.y * c13x3 * c23y2 +
        3 * c20.x * c13y3 * c23x2 +
        c12y3 * c13.x * c23x2 -
        c12x3 * c13.y * c23y2 -
        3 * c10.x * c13x2 * c13.y * c23y2 +
        3 * c10.y * c13.x * c13y2 * c23x2 -
        2 * c11.x * c12.y * c13x2 * c23y2 +
        c11.x * c12.y * c13y2 * c23x2 -
        c11.y * c12.x * c13x2 * c23y2 +
        2 * c11.y * c12.x * c13y2 * c23x2 +
        3 * c20.x * c13x2 * c13.y * c23y2 -
        c12.x * c12y2 * c13.y * c23x2 -
        3 * c20.y * c13.x * c13y2 * c23x2 +
        c12x2 * c12.y * c13.x * c23y2 -
        3 * c13.x * c22x2 * c13y2 * c22.y +
        c13x2 * c13.y * c23.x * (6 * c20.y * c23.y + 6 * c21.y * c22.y) +
        c13x2 * c22.x * c13.y * (6 * c21.y * c23.y + 3 * c22y2) +
        c13x3 *
          (-2 * c21.y * c22.y * c23.y -
            c20.y * c23y2 -
            c22.y * (2 * c21.y * c23.y + c22y2) -
            c23.y * (2 * c20.y * c23.y + 2 * c21.y * c22.y)),

      6 * c11.x * c12.x * c13.x * c13.y * c22.y * c23.y +
        c11.x * c12.y * c13.x * c22.x * c13.y * c23.y +
        c11.x * c12.y * c13.x * c13.y * c22.y * c23.x -
        c11.y * c12.x * c13.x * c22.x * c13.y * c23.y -
        c11.y * c12.x * c13.x * c13.y * c22.y * c23.x -
        6 * c11.y * c12.y * c13.x * c22.x * c13.y * c23.x -
        6 * c10.x * c22.x * c13y3 * c23.x +
        6 * c20.x * c22.x * c13y3 * c23.x +
        6 * c10.y * c13x3 * c22.y * c23.y +
        2 * c12y3 * c13.x * c22.x * c23.x -
        2 * c12x3 * c13.y * c22.y * c23.y +
        6 * c10.x * c13.x * c22.x * c13y2 * c23.y +
        6 * c10.x * c13.x * c13y2 * c22.y * c23.x +
        6 * c10.y * c13.x * c22.x * c13y2 * c23.x -
        3 * c11.x * c12.x * c22.x * c13y2 * c23.y -
        3 * c11.x * c12.x * c13y2 * c22.y * c23.x +
        2 * c11.x * c12.y * c22.x * c13y2 * c23.x +
        4 * c11.y * c12.x * c22.x * c13y2 * c23.x -
        6 * c10.x * c13x2 * c13.y * c22.y * c23.y -
        6 * c10.y * c13x2 * c22.x * c13.y * c23.y -
        6 * c10.y * c13x2 * c13.y * c22.y * c23.x -
        4 * c11.x * c12.y * c13x2 * c22.y * c23.y -
        6 * c20.x * c13.x * c22.x * c13y2 * c23.y -
        6 * c20.x * c13.x * c13y2 * c22.y * c23.x -
        2 * c11.y * c12.x * c13x2 * c22.y * c23.y +
        3 * c11.y * c12.y * c13x2 * c22.x * c23.y +
        3 * c11.y * c12.y * c13x2 * c22.y * c23.x -
        2 * c12.x * c12y2 * c13.x * c22.x * c23.y -
        2 * c12.x * c12y2 * c13.x * c22.y * c23.x -
        2 * c12.x * c12y2 * c22.x * c13.y * c23.x -
        6 * c20.y * c13.x * c22.x * c13y2 * c23.x -
        6 * c21.x * c13.x * c21.y * c13y2 * c23.x -
        6 * c21.x * c13.x * c22.x * c13y2 * c22.y +
        6 * c20.x * c13x2 * c13.y * c22.y * c23.y +
        2 * c12x2 * c12.y * c13.x * c22.y * c23.y +
        2 * c12x2 * c12.y * c22.x * c13.y * c23.y +
        2 * c12x2 * c12.y * c13.y * c22.y * c23.x +
        3 * c21.x * c22x2 * c13y3 +
        3 * c21x2 * c13y3 * c23.x -
        3 * c13.x * c21.y * c22x2 * c13y2 -
        3 * c21x2 * c13.x * c13y2 * c23.y +
        c13x2 * c22.x * c13.y * (6 * c20.y * c23.y + 6 * c21.y * c22.y) +
        c13x2 * c13.y * c23.x * (6 * c20.y * c22.y + 3 * c21y2) +
        c21.x * c13x2 * c13.y * (6 * c21.y * c23.y + 3 * c22y2) +
        c13x3 *
          (-2 * c20.y * c22.y * c23.y -
            c23.y * (2 * c20.y * c22.y + c21y2) -
            c21.y * (2 * c21.y * c23.y + c22y2) -
            c22.y * (2 * c20.y * c23.y + 2 * c21.y * c22.y)),

      c11.x * c21.x * c12.y * c13.x * c13.y * c23.y +
        c11.x * c12.y * c13.x * c21.y * c13.y * c23.x +
        c11.x * c12.y * c13.x * c22.x * c13.y * c22.y -
        c11.y * c12.x * c21.x * c13.x * c13.y * c23.y -
        c11.y * c12.x * c13.x * c21.y * c13.y * c23.x -
        c11.y * c12.x * c13.x * c22.x * c13.y * c22.y -
        6 * c11.y * c21.x * c12.y * c13.x * c13.y * c23.x -
        6 * c10.x * c21.x * c13y3 * c23.x +
        6 * c20.x * c21.x * c13y3 * c23.x +
        2 * c21.x * c12y3 * c13.x * c23.x +
        6 * c10.x * c21.x * c13.x * c13y2 * c23.y +
        6 * c10.x * c13.x * c21.y * c13y2 * c23.x +
        6 * c10.x * c13.x * c22.x * c13y2 * c22.y +
        6 * c10.y * c21.x * c13.x * c13y2 * c23.x -
        3 * c11.x * c12.x * c21.x * c13y2 * c23.y -
        3 * c11.x * c12.x * c21.y * c13y2 * c23.x -
        3 * c11.x * c12.x * c22.x * c13y2 * c22.y +
        2 * c11.x * c21.x * c12.y * c13y2 * c23.x +
        4 * c11.y * c12.x * c21.x * c13y2 * c23.x -
        6 * c10.y * c21.x * c13x2 * c13.y * c23.y -
        6 * c10.y * c13x2 * c21.y * c13.y * c23.x -
        6 * c10.y * c13x2 * c22.x * c13.y * c22.y -
        6 * c20.x * c21.x * c13.x * c13y2 * c23.y -
        6 * c20.x * c13.x * c21.y * c13y2 * c23.x -
        6 * c20.x * c13.x * c22.x * c13y2 * c22.y +
        3 * c11.y * c21.x * c12.y * c13x2 * c23.y -
        3 * c11.y * c12.y * c13.x * c22x2 * c13.y +
        3 * c11.y * c12.y * c13x2 * c21.y * c23.x +
        3 * c11.y * c12.y * c13x2 * c22.x * c22.y -
        2 * c12.x * c21.x * c12y2 * c13.x * c23.y -
        2 * c12.x * c21.x * c12y2 * c13.y * c23.x -
        2 * c12.x * c12y2 * c13.x * c21.y * c23.x -
        2 * c12.x * c12y2 * c13.x * c22.x * c22.y -
        6 * c20.y * c21.x * c13.x * c13y2 * c23.x -
        6 * c21.x * c13.x * c21.y * c22.x * c13y2 +
        6 * c20.y * c13x2 * c21.y * c13.y * c23.x +
        2 * c12x2 * c21.x * c12.y * c13.y * c23.y +
        2 * c12x2 * c12.y * c21.y * c13.y * c23.x +
        2 * c12x2 * c12.y * c22.x * c13.y * c22.y -
        3 * c10.x * c22x2 * c13y3 +
        3 * c20.x * c22x2 * c13y3 +
        3 * c21x2 * c22.x * c13y3 +
        c12y3 * c13.x * c22x2 +
        3 * c10.y * c13.x * c22x2 * c13y2 +
        c11.x * c12.y * c22x2 * c13y2 +
        2 * c11.y * c12.x * c22x2 * c13y2 -
        c12.x * c12y2 * c22x2 * c13.y -
        3 * c20.y * c13.x * c22x2 * c13y2 -
        3 * c21x2 * c13.x * c13y2 * c22.y +
        c12x2 * c12.y * c13.x * (2 * c21.y * c23.y + c22y2) +
        c11.x * c12.x * c13.x * c13.y * (6 * c21.y * c23.y + 3 * c22y2) +
        c21.x * c13x2 * c13.y * (6 * c20.y * c23.y + 6 * c21.y * c22.y) +
        c12x3 * c13.y * (-2 * c21.y * c23.y - c22y2) +
        c10.y * c13x3 * (6 * c21.y * c23.y + 3 * c22y2) +
        c11.y * c12.x * c13x2 * (-2 * c21.y * c23.y - c22y2) +
        c11.x * c12.y * c13x2 * (-4 * c21.y * c23.y - 2 * c22y2) +
        c10.x * c13x2 * c13.y * (-6 * c21.y * c23.y - 3 * c22y2) +
        c13x2 * c22.x * c13.y * (6 * c20.y * c22.y + 3 * c21y2) +
        c20.x * c13x2 * c13.y * (6 * c21.y * c23.y + 3 * c22y2) +
        c13x3 *
          (-2 * c20.y * c21.y * c23.y -
            c22.y * (2 * c20.y * c22.y + c21y2) -
            c20.y * (2 * c21.y * c23.y + c22y2) -
            c21.y * (2 * c20.y * c23.y + 2 * c21.y * c22.y)),

      -c10.x * c11.x * c12.y * c13.x * c13.y * c23.y +
        c10.x * c11.y * c12.x * c13.x * c13.y * c23.y +
        6 * c10.x * c11.y * c12.y * c13.x * c13.y * c23.x -
        6 * c10.y * c11.x * c12.x * c13.x * c13.y * c23.y -
        c10.y * c11.x * c12.y * c13.x * c13.y * c23.x +
        c10.y * c11.y * c12.x * c13.x * c13.y * c23.x +
        c11.x * c11.y * c12.x * c12.y * c13.x * c23.y -
        c11.x * c11.y * c12.x * c12.y * c13.y * c23.x +
        c11.x * c20.x * c12.y * c13.x * c13.y * c23.y +
        c11.x * c20.y * c12.y * c13.x * c13.y * c23.x +
        c11.x * c21.x * c12.y * c13.x * c13.y * c22.y +
        c11.x * c12.y * c13.x * c21.y * c22.x * c13.y -
        c20.x * c11.y * c12.x * c13.x * c13.y * c23.y -
        6 * c20.x * c11.y * c12.y * c13.x * c13.y * c23.x -
        c11.y * c12.x * c20.y * c13.x * c13.y * c23.x -
        c11.y * c12.x * c21.x * c13.x * c13.y * c22.y -
        c11.y * c12.x * c13.x * c21.y * c22.x * c13.y -
        6 * c11.y * c21.x * c12.y * c13.x * c22.x * c13.y -
        6 * c10.x * c20.x * c13y3 * c23.x -
        6 * c10.x * c21.x * c22.x * c13y3 -
        2 * c10.x * c12y3 * c13.x * c23.x +
        6 * c20.x * c21.x * c22.x * c13y3 +
        2 * c20.x * c12y3 * c13.x * c23.x +
        2 * c21.x * c12y3 * c13.x * c22.x +
        2 * c10.y * c12x3 * c13.y * c23.y -
        6 * c10.x * c10.y * c13.x * c13y2 * c23.x +
        3 * c10.x * c11.x * c12.x * c13y2 * c23.y -
        2 * c10.x * c11.x * c12.y * c13y2 * c23.x -
        4 * c10.x * c11.y * c12.x * c13y2 * c23.x +
        3 * c10.y * c11.x * c12.x * c13y2 * c23.x +
        6 * c10.x * c10.y * c13x2 * c13.y * c23.y +
        6 * c10.x * c20.x * c13.x * c13y2 * c23.y -
        3 * c10.x * c11.y * c12.y * c13x2 * c23.y +
        2 * c10.x * c12.x * c12y2 * c13.x * c23.y +
        2 * c10.x * c12.x * c12y2 * c13.y * c23.x +
        6 * c10.x * c20.y * c13.x * c13y2 * c23.x +
        6 * c10.x * c21.x * c13.x * c13y2 * c22.y +
        6 * c10.x * c13.x * c21.y * c22.x * c13y2 +
        4 * c10.y * c11.x * c12.y * c13x2 * c23.y +
        6 * c10.y * c20.x * c13.x * c13y2 * c23.x +
        2 * c10.y * c11.y * c12.x * c13x2 * c23.y -
        3 * c10.y * c11.y * c12.y * c13x2 * c23.x +
        2 * c10.y * c12.x * c12y2 * c13.x * c23.x +
        6 * c10.y * c21.x * c13.x * c22.x * c13y2 -
        3 * c11.x * c20.x * c12.x * c13y2 * c23.y +
        2 * c11.x * c20.x * c12.y * c13y2 * c23.x +
        c11.x * c11.y * c12y2 * c13.x * c23.x -
        3 * c11.x * c12.x * c20.y * c13y2 * c23.x -
        3 * c11.x * c12.x * c21.x * c13y2 * c22.y -
        3 * c11.x * c12.x * c21.y * c22.x * c13y2 +
        2 * c11.x * c21.x * c12.y * c22.x * c13y2 +
        4 * c20.x * c11.y * c12.x * c13y2 * c23.x +
        4 * c11.y * c12.x * c21.x * c22.x * c13y2 -
        2 * c10.x * c12x2 * c12.y * c13.y * c23.y -
        6 * c10.y * c20.x * c13x2 * c13.y * c23.y -
        6 * c10.y * c20.y * c13x2 * c13.y * c23.x -
        6 * c10.y * c21.x * c13x2 * c13.y * c22.y -
        2 * c10.y * c12x2 * c12.y * c13.x * c23.y -
        2 * c10.y * c12x2 * c12.y * c13.y * c23.x -
        6 * c10.y * c13x2 * c21.y * c22.x * c13.y -
        c11.x * c11.y * c12x2 * c13.y * c23.y -
        2 * c11.x * c11y2 * c13.x * c13.y * c23.x +
        3 * c20.x * c11.y * c12.y * c13x2 * c23.y -
        2 * c20.x * c12.x * c12y2 * c13.x * c23.y -
        2 * c20.x * c12.x * c12y2 * c13.y * c23.x -
        6 * c20.x * c20.y * c13.x * c13y2 * c23.x -
        6 * c20.x * c21.x * c13.x * c13y2 * c22.y -
        6 * c20.x * c13.x * c21.y * c22.x * c13y2 +
        3 * c11.y * c20.y * c12.y * c13x2 * c23.x +
        3 * c11.y * c21.x * c12.y * c13x2 * c22.y +
        3 * c11.y * c12.y * c13x2 * c21.y * c22.x -
        2 * c12.x * c20.y * c12y2 * c13.x * c23.x -
        2 * c12.x * c21.x * c12y2 * c13.x * c22.y -
        2 * c12.x * c21.x * c12y2 * c22.x * c13.y -
        2 * c12.x * c12y2 * c13.x * c21.y * c22.x -
        6 * c20.y * c21.x * c13.x * c22.x * c13y2 -
        c11y2 * c12.x * c12.y * c13.x * c23.x +
        2 * c20.x * c12x2 * c12.y * c13.y * c23.y +
        6 * c20.y * c13x2 * c21.y * c22.x * c13.y +
        2 * c11x2 * c11.y * c13.x * c13.y * c23.y +
        c11x2 * c12.x * c12.y * c13.y * c23.y +
        2 * c12x2 * c20.y * c12.y * c13.y * c23.x +
        2 * c12x2 * c21.x * c12.y * c13.y * c22.y +
        2 * c12x2 * c12.y * c21.y * c22.x * c13.y +
        c21x3 * c13y3 +
        3 * c10x2 * c13y3 * c23.x -
        3 * c10y2 * c13x3 * c23.y +
        3 * c20x2 * c13y3 * c23.x +
        c11y3 * c13x2 * c23.x -
        c11x3 * c13y2 * c23.y -
        c11.x * c11y2 * c13x2 * c23.y +
        c11x2 * c11.y * c13y2 * c23.x -
        3 * c10x2 * c13.x * c13y2 * c23.y +
        3 * c10y2 * c13x2 * c13.y * c23.x -
        c11x2 * c12y2 * c13.x * c23.y +
        c11y2 * c12x2 * c13.y * c23.x -
        3 * c21x2 * c13.x * c21.y * c13y2 -
        3 * c20x2 * c13.x * c13y2 * c23.y +
        3 * c20y2 * c13x2 * c13.y * c23.x +
        c11.x *
          c12.x *
          c13.x *
          c13.y *
          (6 * c20.y * c23.y + 6 * c21.y * c22.y) +
        c12x3 * c13.y * (-2 * c20.y * c23.y - 2 * c21.y * c22.y) +
        c10.y * c13x3 * (6 * c20.y * c23.y + 6 * c21.y * c22.y) +
        c11.y * c12.x * c13x2 * (-2 * c20.y * c23.y - 2 * c21.y * c22.y) +
        c12x2 * c12.y * c13.x * (2 * c20.y * c23.y + 2 * c21.y * c22.y) +
        c11.x * c12.y * c13x2 * (-4 * c20.y * c23.y - 4 * c21.y * c22.y) +
        c10.x * c13x2 * c13.y * (-6 * c20.y * c23.y - 6 * c21.y * c22.y) +
        c20.x * c13x2 * c13.y * (6 * c20.y * c23.y + 6 * c21.y * c22.y) +
        c21.x * c13x2 * c13.y * (6 * c20.y * c22.y + 3 * c21y2) +
        c13x3 *
          (-2 * c20.y * c21.y * c22.y -
            c20y2 * c23.y -
            c21.y * (2 * c20.y * c22.y + c21y2) -
            c20.y * (2 * c20.y * c23.y + 2 * c21.y * c22.y)),

      -c10.x * c11.x * c12.y * c13.x * c13.y * c22.y +
        c10.x * c11.y * c12.x * c13.x * c13.y * c22.y +
        6 * c10.x * c11.y * c12.y * c13.x * c22.x * c13.y -
        6 * c10.y * c11.x * c12.x * c13.x * c13.y * c22.y -
        c10.y * c11.x * c12.y * c13.x * c22.x * c13.y +
        c10.y * c11.y * c12.x * c13.x * c22.x * c13.y +
        c11.x * c11.y * c12.x * c12.y * c13.x * c22.y -
        c11.x * c11.y * c12.x * c12.y * c22.x * c13.y +
        c11.x * c20.x * c12.y * c13.x * c13.y * c22.y +
        c11.x * c20.y * c12.y * c13.x * c22.x * c13.y +
        c11.x * c21.x * c12.y * c13.x * c21.y * c13.y -
        c20.x * c11.y * c12.x * c13.x * c13.y * c22.y -
        6 * c20.x * c11.y * c12.y * c13.x * c22.x * c13.y -
        c11.y * c12.x * c20.y * c13.x * c22.x * c13.y -
        c11.y * c12.x * c21.x * c13.x * c21.y * c13.y -
        6 * c10.x * c20.x * c22.x * c13y3 -
        2 * c10.x * c12y3 * c13.x * c22.x +
        2 * c20.x * c12y3 * c13.x * c22.x +
        2 * c10.y * c12x3 * c13.y * c22.y -
        6 * c10.x * c10.y * c13.x * c22.x * c13y2 +
        3 * c10.x * c11.x * c12.x * c13y2 * c22.y -
        2 * c10.x * c11.x * c12.y * c22.x * c13y2 -
        4 * c10.x * c11.y * c12.x * c22.x * c13y2 +
        3 * c10.y * c11.x * c12.x * c22.x * c13y2 +
        6 * c10.x * c10.y * c13x2 * c13.y * c22.y +
        6 * c10.x * c20.x * c13.x * c13y2 * c22.y -
        3 * c10.x * c11.y * c12.y * c13x2 * c22.y +
        2 * c10.x * c12.x * c12y2 * c13.x * c22.y +
        2 * c10.x * c12.x * c12y2 * c22.x * c13.y +
        6 * c10.x * c20.y * c13.x * c22.x * c13y2 +
        6 * c10.x * c21.x * c13.x * c21.y * c13y2 +
        4 * c10.y * c11.x * c12.y * c13x2 * c22.y +
        6 * c10.y * c20.x * c13.x * c22.x * c13y2 +
        2 * c10.y * c11.y * c12.x * c13x2 * c22.y -
        3 * c10.y * c11.y * c12.y * c13x2 * c22.x +
        2 * c10.y * c12.x * c12y2 * c13.x * c22.x -
        3 * c11.x * c20.x * c12.x * c13y2 * c22.y +
        2 * c11.x * c20.x * c12.y * c22.x * c13y2 +
        c11.x * c11.y * c12y2 * c13.x * c22.x -
        3 * c11.x * c12.x * c20.y * c22.x * c13y2 -
        3 * c11.x * c12.x * c21.x * c21.y * c13y2 +
        4 * c20.x * c11.y * c12.x * c22.x * c13y2 -
        2 * c10.x * c12x2 * c12.y * c13.y * c22.y -
        6 * c10.y * c20.x * c13x2 * c13.y * c22.y -
        6 * c10.y * c20.y * c13x2 * c22.x * c13.y -
        6 * c10.y * c21.x * c13x2 * c21.y * c13.y -
        2 * c10.y * c12x2 * c12.y * c13.x * c22.y -
        2 * c10.y * c12x2 * c12.y * c22.x * c13.y -
        c11.x * c11.y * c12x2 * c13.y * c22.y -
        2 * c11.x * c11y2 * c13.x * c22.x * c13.y +
        3 * c20.x * c11.y * c12.y * c13x2 * c22.y -
        2 * c20.x * c12.x * c12y2 * c13.x * c22.y -
        2 * c20.x * c12.x * c12y2 * c22.x * c13.y -
        6 * c20.x * c20.y * c13.x * c22.x * c13y2 -
        6 * c20.x * c21.x * c13.x * c21.y * c13y2 +
        3 * c11.y * c20.y * c12.y * c13x2 * c22.x +
        3 * c11.y * c21.x * c12.y * c13x2 * c21.y -
        2 * c12.x * c20.y * c12y2 * c13.x * c22.x -
        2 * c12.x * c21.x * c12y2 * c13.x * c21.y -
        c11y2 * c12.x * c12.y * c13.x * c22.x +
        2 * c20.x * c12x2 * c12.y * c13.y * c22.y -
        3 * c11.y * c21x2 * c12.y * c13.x * c13.y +
        6 * c20.y * c21.x * c13x2 * c21.y * c13.y +
        2 * c11x2 * c11.y * c13.x * c13.y * c22.y +
        c11x2 * c12.x * c12.y * c13.y * c22.y +
        2 * c12x2 * c20.y * c12.y * c22.x * c13.y +
        2 * c12x2 * c21.x * c12.y * c21.y * c13.y -
        3 * c10.x * c21x2 * c13y3 +
        3 * c20.x * c21x2 * c13y3 +
        3 * c10x2 * c22.x * c13y3 -
        3 * c10y2 * c13x3 * c22.y +
        3 * c20x2 * c22.x * c13y3 +
        c21x2 * c12y3 * c13.x +
        c11y3 * c13x2 * c22.x -
        c11x3 * c13y2 * c22.y +
        3 * c10.y * c21x2 * c13.x * c13y2 -
        c11.x * c11y2 * c13x2 * c22.y +
        c11.x * c21x2 * c12.y * c13y2 +
        2 * c11.y * c12.x * c21x2 * c13y2 +
        c11x2 * c11.y * c22.x * c13y2 -
        c12.x * c21x2 * c12y2 * c13.y -
        3 * c20.y * c21x2 * c13.x * c13y2 -
        3 * c10x2 * c13.x * c13y2 * c22.y +
        3 * c10y2 * c13x2 * c22.x * c13.y -
        c11x2 * c12y2 * c13.x * c22.y +
        c11y2 * c12x2 * c22.x * c13.y -
        3 * c20x2 * c13.x * c13y2 * c22.y +
        3 * c20y2 * c13x2 * c22.x * c13.y +
        c12x2 * c12.y * c13.x * (2 * c20.y * c22.y + c21y2) +
        c11.x * c12.x * c13.x * c13.y * (6 * c20.y * c22.y + 3 * c21y2) +
        c12x3 * c13.y * (-2 * c20.y * c22.y - c21y2) +
        c10.y * c13x3 * (6 * c20.y * c22.y + 3 * c21y2) +
        c11.y * c12.x * c13x2 * (-2 * c20.y * c22.y - c21y2) +
        c11.x * c12.y * c13x2 * (-4 * c20.y * c22.y - 2 * c21y2) +
        c10.x * c13x2 * c13.y * (-6 * c20.y * c22.y - 3 * c21y2) +
        c20.x * c13x2 * c13.y * (6 * c20.y * c22.y + 3 * c21y2) +
        c13x3 *
          (-2 * c20.y * c21y2 -
            c20y2 * c22.y -
            c20.y * (2 * c20.y * c22.y + c21y2)),

      -c10.x * c11.x * c12.y * c13.x * c21.y * c13.y +
        c10.x * c11.y * c12.x * c13.x * c21.y * c13.y +
        6 * c10.x * c11.y * c21.x * c12.y * c13.x * c13.y -
        6 * c10.y * c11.x * c12.x * c13.x * c21.y * c13.y -
        c10.y * c11.x * c21.x * c12.y * c13.x * c13.y +
        c10.y * c11.y * c12.x * c21.x * c13.x * c13.y -
        c11.x * c11.y * c12.x * c21.x * c12.y * c13.y +
        c11.x * c11.y * c12.x * c12.y * c13.x * c21.y +
        c11.x * c20.x * c12.y * c13.x * c21.y * c13.y +
        6 * c11.x * c12.x * c20.y * c13.x * c21.y * c13.y +
        c11.x * c20.y * c21.x * c12.y * c13.x * c13.y -
        c20.x * c11.y * c12.x * c13.x * c21.y * c13.y -
        6 * c20.x * c11.y * c21.x * c12.y * c13.x * c13.y -
        c11.y * c12.x * c20.y * c21.x * c13.x * c13.y -
        6 * c10.x * c20.x * c21.x * c13y3 -
        2 * c10.x * c21.x * c12y3 * c13.x +
        6 * c10.y * c20.y * c13x3 * c21.y +
        2 * c20.x * c21.x * c12y3 * c13.x +
        2 * c10.y * c12x3 * c21.y * c13.y -
        2 * c12x3 * c20.y * c21.y * c13.y -
        6 * c10.x * c10.y * c21.x * c13.x * c13y2 +
        3 * c10.x * c11.x * c12.x * c21.y * c13y2 -
        2 * c10.x * c11.x * c21.x * c12.y * c13y2 -
        4 * c10.x * c11.y * c12.x * c21.x * c13y2 +
        3 * c10.y * c11.x * c12.x * c21.x * c13y2 +
        6 * c10.x * c10.y * c13x2 * c21.y * c13.y +
        6 * c10.x * c20.x * c13.x * c21.y * c13y2 -
        3 * c10.x * c11.y * c12.y * c13x2 * c21.y +
        2 * c10.x * c12.x * c21.x * c12y2 * c13.y +
        2 * c10.x * c12.x * c12y2 * c13.x * c21.y +
        6 * c10.x * c20.y * c21.x * c13.x * c13y2 +
        4 * c10.y * c11.x * c12.y * c13x2 * c21.y +
        6 * c10.y * c20.x * c21.x * c13.x * c13y2 +
        2 * c10.y * c11.y * c12.x * c13x2 * c21.y -
        3 * c10.y * c11.y * c21.x * c12.y * c13x2 +
        2 * c10.y * c12.x * c21.x * c12y2 * c13.x -
        3 * c11.x * c20.x * c12.x * c21.y * c13y2 +
        2 * c11.x * c20.x * c21.x * c12.y * c13y2 +
        c11.x * c11.y * c21.x * c12y2 * c13.x -
        3 * c11.x * c12.x * c20.y * c21.x * c13y2 +
        4 * c20.x * c11.y * c12.x * c21.x * c13y2 -
        6 * c10.x * c20.y * c13x2 * c21.y * c13.y -
        2 * c10.x * c12x2 * c12.y * c21.y * c13.y -
        6 * c10.y * c20.x * c13x2 * c21.y * c13.y -
        6 * c10.y * c20.y * c21.x * c13x2 * c13.y -
        2 * c10.y * c12x2 * c21.x * c12.y * c13.y -
        2 * c10.y * c12x2 * c12.y * c13.x * c21.y -
        c11.x * c11.y * c12x2 * c21.y * c13.y -
        4 * c11.x * c20.y * c12.y * c13x2 * c21.y -
        2 * c11.x * c11y2 * c21.x * c13.x * c13.y +
        3 * c20.x * c11.y * c12.y * c13x2 * c21.y -
        2 * c20.x * c12.x * c21.x * c12y2 * c13.y -
        2 * c20.x * c12.x * c12y2 * c13.x * c21.y -
        6 * c20.x * c20.y * c21.x * c13.x * c13y2 -
        2 * c11.y * c12.x * c20.y * c13x2 * c21.y +
        3 * c11.y * c20.y * c21.x * c12.y * c13x2 -
        2 * c12.x * c20.y * c21.x * c12y2 * c13.x -
        c11y2 * c12.x * c21.x * c12.y * c13.x +
        6 * c20.x * c20.y * c13x2 * c21.y * c13.y +
        2 * c20.x * c12x2 * c12.y * c21.y * c13.y +
        2 * c11x2 * c11.y * c13.x * c21.y * c13.y +
        c11x2 * c12.x * c12.y * c21.y * c13.y +
        2 * c12x2 * c20.y * c21.x * c12.y * c13.y +
        2 * c12x2 * c20.y * c12.y * c13.x * c21.y +
        3 * c10x2 * c21.x * c13y3 -
        3 * c10y2 * c13x3 * c21.y +
        3 * c20x2 * c21.x * c13y3 +
        c11y3 * c21.x * c13x2 -
        c11x3 * c21.y * c13y2 -
        3 * c20y2 * c13x3 * c21.y -
        c11.x * c11y2 * c13x2 * c21.y +
        c11x2 * c11.y * c21.x * c13y2 -
        3 * c10x2 * c13.x * c21.y * c13y2 +
        3 * c10y2 * c21.x * c13x2 * c13.y -
        c11x2 * c12y2 * c13.x * c21.y +
        c11y2 * c12x2 * c21.x * c13.y -
        3 * c20x2 * c13.x * c21.y * c13y2 +
        3 * c20y2 * c21.x * c13x2 * c13.y,

      c10.x * c10.y * c11.x * c12.y * c13.x * c13.y -
        c10.x * c10.y * c11.y * c12.x * c13.x * c13.y +
        c10.x * c11.x * c11.y * c12.x * c12.y * c13.y -
        c10.y * c11.x * c11.y * c12.x * c12.y * c13.x -
        c10.x * c11.x * c20.y * c12.y * c13.x * c13.y +
        6 * c10.x * c20.x * c11.y * c12.y * c13.x * c13.y +
        c10.x * c11.y * c12.x * c20.y * c13.x * c13.y -
        c10.y * c11.x * c20.x * c12.y * c13.x * c13.y -
        6 * c10.y * c11.x * c12.x * c20.y * c13.x * c13.y +
        c10.y * c20.x * c11.y * c12.x * c13.x * c13.y -
        c11.x * c20.x * c11.y * c12.x * c12.y * c13.y +
        c11.x * c11.y * c12.x * c20.y * c12.y * c13.x +
        c11.x * c20.x * c20.y * c12.y * c13.x * c13.y -
        c20.x * c11.y * c12.x * c20.y * c13.x * c13.y -
        2 * c10.x * c20.x * c12y3 * c13.x +
        2 * c10.y * c12x3 * c20.y * c13.y -
        3 * c10.x * c10.y * c11.x * c12.x * c13y2 -
        6 * c10.x * c10.y * c20.x * c13.x * c13y2 +
        3 * c10.x * c10.y * c11.y * c12.y * c13x2 -
        2 * c10.x * c10.y * c12.x * c12y2 * c13.x -
        2 * c10.x * c11.x * c20.x * c12.y * c13y2 -
        c10.x * c11.x * c11.y * c12y2 * c13.x +
        3 * c10.x * c11.x * c12.x * c20.y * c13y2 -
        4 * c10.x * c20.x * c11.y * c12.x * c13y2 +
        3 * c10.y * c11.x * c20.x * c12.x * c13y2 +
        6 * c10.x * c10.y * c20.y * c13x2 * c13.y +
        2 * c10.x * c10.y * c12x2 * c12.y * c13.y +
        2 * c10.x * c11.x * c11y2 * c13.x * c13.y +
        2 * c10.x * c20.x * c12.x * c12y2 * c13.y +
        6 * c10.x * c20.x * c20.y * c13.x * c13y2 -
        3 * c10.x * c11.y * c20.y * c12.y * c13x2 +
        2 * c10.x * c12.x * c20.y * c12y2 * c13.x +
        c10.x * c11y2 * c12.x * c12.y * c13.x +
        c10.y * c11.x * c11.y * c12x2 * c13.y +
        4 * c10.y * c11.x * c20.y * c12.y * c13x2 -
        3 * c10.y * c20.x * c11.y * c12.y * c13x2 +
        2 * c10.y * c20.x * c12.x * c12y2 * c13.x +
        2 * c10.y * c11.y * c12.x * c20.y * c13x2 +
        c11.x * c20.x * c11.y * c12y2 * c13.x -
        3 * c11.x * c20.x * c12.x * c20.y * c13y2 -
        2 * c10.x * c12x2 * c20.y * c12.y * c13.y -
        6 * c10.y * c20.x * c20.y * c13x2 * c13.y -
        2 * c10.y * c20.x * c12x2 * c12.y * c13.y -
        2 * c10.y * c11x2 * c11.y * c13.x * c13.y -
        c10.y * c11x2 * c12.x * c12.y * c13.y -
        2 * c10.y * c12x2 * c20.y * c12.y * c13.x -
        2 * c11.x * c20.x * c11y2 * c13.x * c13.y -
        c11.x * c11.y * c12x2 * c20.y * c13.y +
        3 * c20.x * c11.y * c20.y * c12.y * c13x2 -
        2 * c20.x * c12.x * c20.y * c12y2 * c13.x -
        c20.x * c11y2 * c12.x * c12.y * c13.x +
        3 * c10y2 * c11.x * c12.x * c13.x * c13.y +
        3 * c11.x * c12.x * c20y2 * c13.x * c13.y +
        2 * c20.x * c12x2 * c20.y * c12.y * c13.y -
        3 * c10x2 * c11.y * c12.y * c13.x * c13.y +
        2 * c11x2 * c11.y * c20.y * c13.x * c13.y +
        c11x2 * c12.x * c20.y * c12.y * c13.y -
        3 * c20x2 * c11.y * c12.y * c13.x * c13.y -
        c10x3 * c13y3 +
        c10y3 * c13x3 +
        c20x3 * c13y3 -
        c20y3 * c13x3 -
        3 * c10.x * c20x2 * c13y3 -
        c10.x * c11y3 * c13x2 +
        3 * c10x2 * c20.x * c13y3 +
        c10.y * c11x3 * c13y2 +
        3 * c10.y * c20y2 * c13x3 +
        c20.x * c11y3 * c13x2 +
        c10x2 * c12y3 * c13.x -
        3 * c10y2 * c20.y * c13x3 -
        c10y2 * c12x3 * c13.y +
        c20x2 * c12y3 * c13.x -
        c11x3 * c20.y * c13y2 -
        c12x3 * c20y2 * c13.y -
        c10.x * c11x2 * c11.y * c13y2 +
        c10.y * c11.x * c11y2 * c13x2 -
        3 * c10.x * c10y2 * c13x2 * c13.y -
        c10.x * c11y2 * c12x2 * c13.y +
        c10.y * c11x2 * c12y2 * c13.x -
        c11.x * c11y2 * c20.y * c13x2 +
        3 * c10x2 * c10.y * c13.x * c13y2 +
        c10x2 * c11.x * c12.y * c13y2 +
        2 * c10x2 * c11.y * c12.x * c13y2 -
        2 * c10y2 * c11.x * c12.y * c13x2 -
        c10y2 * c11.y * c12.x * c13x2 +
        c11x2 * c20.x * c11.y * c13y2 -
        3 * c10.x * c20y2 * c13x2 * c13.y +
        3 * c10.y * c20x2 * c13.x * c13y2 +
        c11.x * c20x2 * c12.y * c13y2 -
        2 * c11.x * c20y2 * c12.y * c13x2 +
        c20.x * c11y2 * c12x2 * c13.y -
        c11.y * c12.x * c20y2 * c13x2 -
        c10x2 * c12.x * c12y2 * c13.y -
        3 * c10x2 * c20.y * c13.x * c13y2 +
        3 * c10y2 * c20.x * c13x2 * c13.y +
        c10y2 * c12x2 * c12.y * c13.x -
        c11x2 * c20.y * c12y2 * c13.x +
        2 * c20x2 * c11.y * c12.x * c13y2 +
        3 * c20.x * c20y2 * c13x2 * c13.y -
        c20x2 * c12.x * c12y2 * c13.y -
        3 * c20x2 * c20.y * c13.x * c13y2 +
        c12x2 * c20y2 * c12.y * c13.x
    ]);

    let roots = poly.rootsInterval(0, 1);

    for (let i of Object.keys(roots || {})) {
      let s = roots[i];
      let xRoots = new Polynomial([
        c13.x,
        c12.x,
        c11.x,
        c10.x - c20.x - s * c21.x - s * s * c22.x - s * s * s * c23.x
      ]).roots();
      let yRoots = new Polynomial([
        c13.y,
        c12.y,
        c11.y,
        c10.y - c20.y - s * c21.y - s * s * c22.y - s * s * s * c23.y
      ]).roots();

      if (xRoots.length > 0 && yRoots.length > 0) {
        // IMPORTANT
        // Tweaking this to be smaller can make it miss intersections.
        let tolerance = 1e-2;

        for (let j of Object.keys(xRoots || {})) {
          let xRoot = xRoots[j];
          if (0 <= xRoot && xRoot <= 1) {
            for (let k of Object.keys(yRoots || {})) {
              let yRoot = yRoots[k];
              if (Math.abs(xRoot - yRoot) < tolerance) {
                results.push(
                  c23
                    .multiplyBy(s * s * s)
                    .add(c22.multiplyBy(s * s).add(c21.multiplyBy(s).add(c20)))
                );
              }
            }
          }
        }
      }
    }
    return results;
  }
}
CubicBezier.initClass();
