import Posn from 'geometry/posn';

// PathPoint

export default class PathPoint extends Posn {
  constructor(x, y, pX, pY, sX, sY) {
    super(x, y);

    if (pX && pY) {
      this.setPHandle(pX, pY);
    }
    if (sX && sY) {
      this.setSHandle(pX, pY);
    }
  }

  static fromPosns(p, pHandle, sHandle) {
    let x, y, pX, pY, sX, sY;
    if (p) {
      x = p.x;
      y = p.y;
    }
    if (pHandle) {
      pX = pHandle.x;
      pY = pHandle.y;
    }
    if (sHandle) {
      sX = sHandle.x;
      sY = sHandle.y;
    }
    return new PathPoint(x, y, pX, pY, sX, sY);
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
            // [100, 120, 300.5, 320.5]

            // Main point coords
            let p;
            // Point pHandle coords
            let pHandle;
            // Preceding point sHandle coords (set this retroactively)
            let prec_sHandle;

            switch (key) {
              case 'moveTo':
              case 'lineTo':
                p = new Posn(values[0], values[1]);
                break;
              case 'vertiTo':
                p = new Posn(prec.x, values[0]);
                break;
              case 'horizTo':
                p = new Posn(values[0], prec.y);
                break;
              case 'smoothTo':
                p = new Posn(values[2], values[3]);
                pHandle = new Posn(values[0], values[1]);
                pHandle.x = values[0];
                pHandle.y = values[1];

                prec.reflecPHandleToSHandle();
                /*
                if (prec instanceof CurveTo) {
                  // Reflect other handle
                  prec_sHandle = prec.pHandle().reflect(prec.p()); 
                } else {
                  prec_sHandle = null; // No implied handle
                }
                */
                break;
              case 'curveTo':
                p = new Posn(values[4], values[5]);
                pHandle = new Posn(values[2], values[3]);
                prec_sHandle = new Posn(values[0], values[1]);
            }

            let point = PathPoint.fromPosns(p, pHandle);
            if (prec && prec_sHandle) {
              prec.setSHandle(prec_sHandle.x, prec_sHandle.y);
            }

            points.push(point);
            prec = point;

            sliceAt += elen;
          }

        } else {
          // We got a weird amount of points. Dunno what to do with that.
          // TODO maybe I should actually rethink this later to be more robust: like, parse what I can and
          // ignore the rest. Idk if that would be irresponsible.
          throw new Error(`Wrong amount of coordinates: ${string}. Expected ${elen} and got ${clen}.`);
        }

        // Don't keep looking
        break;
      }
    }

    if (points.length === 0) {
      console.error(`Unreadable path value: ${string}`);
    }

    return points;
  }

  setPHandle(pX, pY) {
    this.pHandle = new Posn(pX, pY);
  }

  setSHandle(sX, sY) {
    this.sHandle = new Posn(sX, sY);
  }

  reflecPHandleToSHandle() {
    if (this.pHandle) {
      this.setSHandle(this.pHandle.reflect(this));
    }
  }

  setOwner(path) {
    this.owner = path;
  }
}