import Posn from 'geometry/posn';
/*

  Point



     o -----------
    /
   /
  /

  Tangible body for posn.
  Stored in PointsList for every shape.
  Comes in many flavors for a Path:
    MoveTo
    LineTo
    HorizTo
    VertiTo
    CurvePoint
      CurveTo
      SmoothTo

  This is the most heavily sub-classed class, even heavier than Monsvg.
  It's also the most heavily used, since all shapes are made of many of these.

  Needless to say, this is a very important class.
  Its efficiency basically decides the entire application's speed.
  (Not sure it's as good as it could be right now)

*/

export default class Point extends Posn {
  constructor(x, y) {
    super(x, y);
    this.constructArgs = arguments;
    if (((this.x == null)) && ((this.y == null))) { return; }


    // Robustness principle!
    // You can make a Point in many ways.
    //
    //   Posn: Give a posn, and it will just inherit the x and y positions
    //   Event:
    //     Give it an event with clientX and clientY
    //   Object:
    //     Give it a generic Object with an x and y
    //   String:
    //     Give it an SVG string like "M10 20"
    //
    // It will do what's most appropriate in each case; for the first three
    // it will just inherit x and y values from the input. In the third case
    // given an SVG string it will actually return a subclass of itself based
    // on what the string is.

    if (this.x instanceof Posn) {
      this.y = this.x.y;
      this.x = this.x.x;
    } else if (this.x instanceof Object) {
      if (this.x.clientX != null) {
        // ...then it's an Event object
        this.y = this.x.clientY;
        this.x = this.x.clientX;
      } else if ((this.x.x != null) && (this.x.y != null)) {
        // ...then it's some generic object
        this.y = this.x.y;
        this.x = this.x.x;
      }
    } else if (typeof this.x === "string") {
      console.trace();
      console.log('UNSUPPORTED');
    }

    if (this.x == Infinity || this.x == -Infinity) {
      debugger;
      console.warn('Infinity x');
    }

    if (isNaN(this.x)) {
      debugger;
      console.warn('NaN x');
    }
    if (isNaN(this.y)) {
      debugger;
      console.warn('NaN y');
    }

    this._flags = [];
  }

  static fromString(string, prec) {
    // Given a string like "M 10.2 502.19"
    // return the corresponding Point.
    // Returns one of:
    //   MoveTo
    //   CurveTo
    //   SmoothTo
    //   LineTo
    //   HorizTo
    //   VertiTo

    let patterns = {
      moveTo:   /M[^A-Za-z]+/i,
      lineTo:   /L[^A-Za-z]+/i,
      curveTo:  /C[^A-Za-z]+/i,
      smoothTo: /S[^A-Za-z]+/i,
      horizTo:  /H[^A-Za-z]+/i,
      vertiTo:  /V[^A-Za-z]+/i
    };

    let classes = {
      moveTo:   MoveTo,
      lineTo:   LineTo,
      curveTo:  CurveTo,
    };

    let lengths = {
      moveTo:   2,
      lineTo:   2,
      curveTo:  6,
      smoothTo: 4,
      horizTo:  1,
      vertiTo:  1
    };

    let pairs = /[-+]?\d*\.?\d*(e\-)?\d*/g;

    // It's possible in SVG to list several sets of coords
    // for one character key. For example, "L 10 20 40 50"
    // is actually two seperate LineTos: a (10, 20) and a (40, 50)
    //
    // So we build the point(s) into an array, and return points[0]
    // if there's one, or the whole array if there's more.
    let points = [];

    for (let key in patterns) {
      // Find which pattern this string matches.
      // This check uses regex to also validate the point's syntax at the same time.

      let val = patterns[key];
      let matched = string.match(val);

      if (matched !== null) {

        // Matched will not be null when we find the correct point from the 'pattern' regex collection.
        // Match for the cooridinate pairs inside this point (1-3 should show up)
        // These then get mapped with parseFloat to get the true values, as coords

        let coords = (string.match(pairs)).filter(p => p.length > 0).map(parseFloat);

        let relative = string.substring(0,1).match(/[mlcshv]/) !== null; // Is it lower-case? So it's relative? Shit!

        //
        //TODO debug with chipotle logo
        //what happens when first point is relative?
        /*
        if (relative && !prec) {
          relative = false;
        }
        */

        let clen = coords.length;
        let elen = lengths[key]; // The expected amount of values for this kind of point

        // If the number of coordinates checks out, build the point(s)
        if ((clen % elen) === 0) {

          let sliceAt = 0;

          for (let i = 0, end = (clen / elen) - 1, asc = 0 <= end; asc ? i <= end : i >= end; asc ? i++ : i--) {
            let set = coords.slice(sliceAt, sliceAt + elen);

            // Never represent points as relative internally
            if (relative) {
              for (let si = 0; si < set.length; si++) {
                let compareVal;

                switch (key) {
                  case 'vertiTo':
                    compareVal = prec.y;
                    break;
                  default:
                    if (si % 2 === 0) {
                      // x value
                      compareVal = prec.x;
                    } else {
                      // y value
                      compareVal = prec.y;
                    }
                }

                set[si] += compareVal;
              }
            }

            let values = set;

            if (values.join(' ').mentions("NaN")) { debugger; }

            // At this point, values should be an array that looks like this:
            //   [null, 100, 120, 300.5, 320.5, Path]
            // The amount of numbers depends on what kind of point we're making.

            // Build the point from the appropriate constructor


            let cl;

            switch (key) {
              case 'moveTo':
              case 'lineTo':
              case 'curveTo':
                cl = classes[key];
                break;
              case 'vertiTo':
                cl = LineTo;
                values = [prec.x].concat(values);
                break;
              case 'horizTo':
                cl = LineTo;
                values.push(prec.y);
                break;
              case 'smoothTo':
                cl = CurveTo;

                let p2;
                if (prec instanceof CurveTo) {
                  p2 = prec.p3().reflect(prec.p());
                } else {
                  debugger;
                  p2 = new Posn(this.x, this.y);
                }
                values = [p2.x, p2.y].concat(values);
                break;
            }

            values = [null].concat(values).concat([prec]);

            let constructed = new (Function.prototype.bind.apply(cl, values));
            points.push(constructed);
            sliceAt += elen;
            prec = constructed;
          }

        } else {
          // We got a weird amount of points. Dunno what to do with that.
          // TODO maybe I should actually rethink this later to be more robust: like, parse what I can and
          // ignore the rest. Idk if that would be irresponsible.
          throw new Error(`Wrong amount of coordinates: ${string}. Expected ${elen} and got ${clen}.`);
        }

        /*
        console.log('Matched', string, points.map((p) => {
          return p.toString();
        }));
        */

        // Don't keep looking
        break;
      }
    }

    if (points.length === 0) {
      // We have no clue what this is, cuz
      console.error(`Unreadable path value: ${string}`);
    }

    //console.log(string, points);

    return points;
  }

  setOwner(path) {
    this.owner = path;
  }

  inheritPosition(from) {
    // Maintain linked-list order in a PointsList
    this.at         = from.at;
    this.prec       = from.prec;
    this.succ       = from.succ;
    this.prec.succ  = this;
    this.succ.prec  = this;
    return this;
  }

  nudge(xd, yd) {
    super.nudge(xd, yd);

    if (this.succ instanceof CurveTo) {
      this.succ.absorb(this.succ.p2().nudge(xd, yd), 2);
    }


    /*
    // Handle moving MoveTos that are closely associated with this point
    if (this.succ instanceof MoveTo && this.distanceFrom(this.succ) < 1) {
      this.succ.nudge(x, y);
    } else if (this.prec instanceof MoveTo && this.distanceFrom(this.prec) < 1) {
      this.prec.nudge(x, y);
    }
    */


    /*
    if (checkForFirstOrLast == null) { checkForFirstOrLast = true; }
    // TODO address this when we are doing individual point manipulation
    if (this.owner.type === 'path') {
      if (checkForFirstOrLast && this.owner.points.closed) {
        // Check if this is the point overlapping the original MoveTo.
        if ((this === this.owner.points.first) && this.owner.points.last.equal(old)) {
          return this.owner.points.last.nudge(x, y, false);
        } else if ((this === this.owner.points.last) && this.owner.points.first.equal(old)) {
          return this.owner.points.first.nudge(x, y, false);
        }
      }
    }
    */
  }

  toPosn() {
    return new Posn(this.x, this.y);
  }

  toLineSegment() {
    return new LineSegment(this.prec, this);
  }


  /*

    Linked list action

  */

  setSucc(succ) {
    this.succ = succ;
    return succ.prec = this;
  }

  setPrec(prec) {
    return prec.setSucc(this);
  }

  /*

   Visibility functions for the UI

  */

  remove() {
    return;
  }

  flag(flag) { return this._flags.ensure(flag); }

  unflag(flag) { return this._flags.remove(flag); }

  flagged(flag) { return this._flags.has(flag); }
}


export class MoveTo extends Point {
  constructor(x, y, prec) {
    super(...arguments);
  }

  p2() {
    return null;
  }

  toString() { return `M${this.x},${this.y}`; }

  toLineSegment() {
    return this.prec.toLineSegment();
  }

  clone() {
    return new MoveTo(this.x, this.y, this.prec);
  }
}


export class LineTo extends Point {
  constructor(x, y, prec) {
    super(...arguments);
  }

  p2() {
    return null;
  }

  toString() { return `L${this.x},${this.y}`; }

  clone() { return new LineTo(this.x, this.y, this.prec); }
}


export class CurveTo extends Point {
  constructor(x2, y2, x3, y3, x, y, prec) {
    super(x, y, prec);
    this.x2 = x2;
    this.y2 = y2;
    this.x3 = x3;
    this.y3 = y3;
    this.x = x;
    this.y = y;
    this.prec = prec;

    /*

      Each point has a predecessor and a successor (in terms of line segments).

      It has two control points:
        (@x2, @y2) is the first curve control point (p2), which becomes @p2h
        (@x3, @y3) is the second (p3), which becomes @p3h
      (Refer to ASCII art at top of cubic-bezier-line-segment.coffee for point name reference)

      Dragging these mofos will alter the correct control point(s), which will change the curve

      I/P:
        x2, y2: control point (p2)
        x3, y3: control point (p3)
        x, y:   next base point (like any other point)
        prec:   point that comes before it

    */
  }


  p2() {
    return new Posn(this.x2, this.y2);
  }


  p3() {
    return new Posn(this.x3, this.y3);
  }


  p() {
    return new Posn(this.x, this.y);
  }

  absorb(p, n) {
    // I/P: p, Posn
    //      n, 2 or 3 (p2 or p3)
    // Given a Posn/Point and an int (2 or 3), sets @x2/@x3 and @y2/@y3 to p's coordinats.
    // Abstracted method for updating a specific bezier curve control point.

    this[`x${n}`] = p.x;
    return this[`y${n}`] = p.y;
  }


  cleanUp() {
    return;
    this.x2 = cleanUpNumber(this.x2);
    this.y2 = cleanUpNumber(this.y2);
    this.x3 = cleanUpNumber(this.x3);
    this.y3 = cleanUpNumber(this.y3);
    return super.cleanUp(...arguments);
  }

  nudge(xd, yd, which=1) {
    switch (which) {
      case 1:
        super.nudge(xd, yd);
        this.absorb(this.p3().nudge(xd, yd), 3);
        break;
      case 2:
        if (this.succ) {
          this.succ.absorb(this.succ.p2().nudge(xd, yd), 2);
        }
        break;
      case 3:
        this.absorb(this.p3().nudge(xd, yd), 3);
        break;
    }
  }

  scale(x, y, origin) {
    this.absorb(this.p2().scale(x, y, origin), 2);
    this.absorb(this.p3().scale(x, y, origin), 3);
    return super.scale(x, y, origin);
  }


  rotate(a, origin) {
    this.absorb(this.p2().rotate(a, origin), 2);
    this.absorb(this.p3().rotate(a, origin), 3);
    return super.rotate(a, origin);
  }

  toString() { return `C${this.x2},${this.y2} ${this.x3},${this.y3} ${this.x},${this.y}`; }

  reverse() {
    return new CurveTo(this.x3, this.y3, this.x2, this.y2, this.x, this.y, this.prec).inheritPosition(this);
  }

  clone() { return new CurveTo(this.x2, this.y2, this.x3, this.y3, this.x, this.y, this.prec); }
}
