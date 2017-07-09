import LineSegment from 'geometry/line-segment';
import CubicBezier from 'geometry/cubic-bezier-line-segment';
import PathPoint from 'geometry/path-point';

export default class PointsSegment {
  constructor(points, list) {
    this.points = points;

    // Link points up correctly
    for (let i = 0; i < points.length; i++) {
      let prec;
      let succ;

      if (i === 0) {
        prec = points[points.length-1];
        succ = points[i+1];
      } else if (i === points.length-1) {
        prec = points[i-1];
        succ = points[0];
      } else {
        prec = points[i-1];
        succ = points[i+1];
      }

      let pt = points[i]
      pt.prec = prec;
      pt.succ = succ;

      pt.segment = this;
    }

    this.list = list;

    if (this.list != null) {
      this.owner = this.list.owner;
    }
  }

  get length() {
    return this.points.length;
  }

  get path() {
    return this.list.path;
  }

  child(i) {
    return this.points[i];
  }

  get first() {
    return this.points[0];
  }

  get last() {
    return this.points[this.points.length-1];
  }

  get index() {
    let pathIndex = this.path.index;
    let list = this.list;
    let segmentIndex = list.indexOf(this);
    return pathIndex.concat([segmentIndex]);
  }

  relink() {
    for (let i = 0; i < this.points.length; i++) {
      let point = this.points[i];
      let prec, succ;
      if (i === 0) {
        prec = this.last;
        succ = this.points[i+1];
      } else if (i === this.points.length-1) {
        succ = this.first;
        prec = this.points[i-1];
      } else {
        succ = this.points[i+1];
        prec = this.points[i-1];
      }

      point.prec = prec;
      point.succ = succ;
    }
  }

  insert(point, index) {
    if (index === this.points.length) {
      let oldLast = this.last;
      this.points.push(point);
      point.prec = oldLast;
      point.succ = this.first;
    } else {
      this.points = this.points.insertAt(point, index);
    }

    this.relink();

    this.path.clearCachedObjects();

    point.segment = this;

    return;

    let head = this.points.slice(0, index);
    let tail = this.points.slice(index);


    if (point instanceof Array) {
      tail.forEach(p => p.index += point.length);

      point.segment = this;

      return head = head.concat(point);

    } else if (point instanceof PathPoint) {
      debugger;
      tail.forEach(p => p.index += 1);

      head[head.length - 1].setSucc(point);
      tail[0].setPrec(point);

      point.segment = this;

      return head.push(point);
    } else {
      throw new Error(`PointsList: don't know how to insert ${point}.`);
    }
  }

  push(point) {
    if (this.points.length > 0) {
      let fp = this.points[0];
      let lp = this.points[this.points.length-1]
      lp.succ = point;
      point.prec = lp;
      point.succ = fp;
      fp.prec = point;
    }
    this.points.push(point);
    point.segment = this;
  }

  indexOf(point) {
    return this.points.indexOf(point);
  }

  close() {
    // Check if first point and last point are close or identical and
    // reduce them to one.
    let firstPoint = this.points[0];
    let lastPoint  = this.points[this.points.length-1];

    if (this.points.length > 1) {
      if (firstPoint.distanceFrom(lastPoint) < 0.1) {
        if (lastPoint.pHandle) {
          firstPoint.setPHandle(lastPoint.pHandle.x, lastPoint.pHandle.y);
        }
        // Remove last redundant point
        this.points = this.points.slice(0, this.points.length-1);
      }

      firstPoint = this.points[0];
      lastPoint  = this.points[this.points.length-1];
    }

    firstPoint.prec = lastPoint;
    lastPoint.succ = firstPoint;

    this.closed = true;
  }

  get empty() {
    return this.points.length === 0;
  }

  get path() {
    return this.list.path;
  }

  toSVGString() {
    let s = '';

    for (let i = 0; i < this.points.length; i++) {
      let pt = this.points[i];
      if (i === 0) {
        s += `M${pt.x},${pt.y}`;
      } else {
        s += ' ';
        s += pt.toSVGString();
      }
    }

    if (this.closed) {
      let fpt = this.points[0];
      s += ' ';
      s += fpt.toSVGString();
    }

    return s;
  }


  i(n) {
    return this.points[n - this.points[0].i];
  }


  remove(x) {
    // Relink things
    x.prec.succ = x.succ;
    x.succ.prec = x.prec;
    this.points = this.points.remove(x);
  }

  replace(old, replacement) {
    if (replacement instanceof Point) {
      replacement.inheritPosition(old);
      this.points = this.points.replace(old, replacement);

    } else if (replacement instanceof Array) {
      let replen = replacement.length;
      let { i } = old;
      let { prec } = old;
      let { succ } = old;
      old.succ.prec = replacement[replen - 1];
      // Sus
      for (let np of Array.from(replacement)) {
        np.owner = this.owner;

        np.i = i;
        np.prec = prec;
        np.succ = succ;
        prec.succ = np;
        prec = np;
        i += 1;
      }

      this.points = this.points.replace(old, replacement);

      for (let p of Array.from(this.points.slice(i))) {
        p.i += (replen - 1);
      }
    }

    return replacement;
  }

  lineSegments() {
    return this.points.map((p) => { return p.toLineSegment() }).filter((ls) => { return ls !== null });
  }

  nextChildIndex() {
    return this.index.concat([this.children.length]);
  }

  drawPointToCanvas(point, prec, layer, projection) {
    let p = projection.posn(point);
    let p1, p2;

    if ((prec && prec.sHandle)) {
      p1 = projection.posn(prec.sHandle);
    }
    if (point.pHandle) {
      p2 = projection.posn(point.pHandle);
    }

    if (p1 || p2) {
      if (!p1) {
        p1 = projection.posn(prec);
      } else if (!p2) {
        p2 = p;
      }
      layer.bezierCurveTo(p1, p2, p);
    } else {
      layer.lineTo(p);
    }
  }

  drawToCanvas(layer, context, projection) {
    if (!(this.points[0] instanceof PathPoint)) {
      return;
    }
    for (let i = 0; i < this.points.length; i++) {
      let point = this.points[i];
      let prec = point.prec;
      let p = projection.posn(point);
      if (i === 0) {
        layer.moveTo(projection.posn(point))
      } else {
        this.drawPointToCanvas(point, prec, layer, projection);
      }

    }

    if (this.closed) {
      // Re-draw first point
      let point = this.points[0];
      let prec = this.points[this.points.length-1];

      this.drawPointToCanvas(point, prec, layer, projection);
    }
  }
}
