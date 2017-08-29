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
        prec = points[points.length - 1];
        succ = points[i + 1];
      } else if (i === points.length - 1) {
        prec = points[i - 1];
        succ = points[0];
      } else {
        prec = points[i - 1];
        succ = points[i + 1];
      }

      let pt = points[i];
      pt.prec = prec;
      pt.succ = succ;

      pt.segment = this;
    }

    this.list = list;

    if (this.list != null) {
      this.owner = this.list.owner;
    }
  }

  clone() {
    return new PointsSegment(
      this.points.map(p => {
        return p.clone();
      })
    );
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
    return this.points[this.points.length - 1];
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
      point.segment = this;
      let prec, succ;
      if (i === 0) {
        prec = this.last;
        succ = this.points[i + 1];
      } else if (i === this.points.length - 1) {
        succ = this.first;
        prec = this.points[i - 1];
      } else {
        succ = this.points[i + 1];
        prec = this.points[i - 1];
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
      tail.forEach(p => (p.index += point.length));

      point.segment = this;

      return (head = head.concat(point));
    } else if (point instanceof PathPoint) {
      debugger;
      tail.forEach(p => (p.index += 1));

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
      let lp = this.points[this.points.length - 1];
      lp.succ = point;
      point.prec = lp;
      point.succ = fp;
      fp.prec = point;
    }
    this.points.push(point);
    point.segment = this;
  }

  reverse() {
    this.points = this.points.reverse().map(p => {
      return p.reverse();
    });

    this.relink();
  }

  indexOf(point) {
    return this.points.indexOf(point);
  }

  firstPointLastPointEqual() {
    return this.first.distanceFrom(this.last) < 0.1;
  }

  close() {
    // Check if first point and last point are close or identical and
    // reduce them to one.
    let firstPoint = this.points[0];
    let lastPoint = this.points[this.points.length - 1];

    if (this.points.length > 1) {
      if (firstPoint.distanceFrom(lastPoint) < 0.1) {
        if (lastPoint.pHandle) {
          firstPoint.setPHandle(lastPoint.pHandle.x, lastPoint.pHandle.y);
        }
        // Remove last redundant point
        this.points = this.points.slice(0, this.points.length - 1);
      }
    }

    this.closed = true;

    this.fixLinks();
  }

  open() {
    this.closed = false;
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
        s += `M${pt.x.toFixed(8)},${pt.y.toFixed(8)}`;
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
    // TODO remove this shit i think?
    return this.points[n - this.points[0].i];
  }

  split(i) {
    let segA = new PointsSegment(this.points.slice(0, i));
    let segB = new PointsSegment(this.points.slice(i));

    segA.fixLinks();
    segB.fixLinks();

    return [segA, segB];
  }

  popSlice(i) {
    // Removes & returns point slice starting at i
    let slice = this.points.slice(i);
    this.points = this.points.slice(0, i);

    let newSeg = new PointsSegment(slice);
    newSeg.list = this.list;

    this.fixLinks();
    newSeg.fixLinks();

    return newSeg;
  }

  remove(x) {
    if (x.prec) {
      // Relink things
      x.prec.succ = x.succ;
    }
    if (x.succ) {
      x.succ.prec = x.prec;
    }
    this.points = this.points.remove(x);
  }

  shift(n) {
    // Shifts beginning index forward n amount
    // Before:
    // a b c d e f g
    // After shift(2):
    // c d e f g a b

    this.points = this.points.slice(n).concat(this.points.slice(0, n));
  }

  concat(seg) {
    let r = new PointsSegment(this.points.concat(seg.points));
    r.relink();
    r.list = this.list;
    return r;
  }

  fixLinks() {
    this.first.prec = this.last;
    this.last.succ = this.first;
  }

  lineSegments() {
    let points = this.points;
    if (!this.closed) {
      points = points.slice(1);
    }
    return points
      .map(p => {
        return p.toLineSegment();
      })
      .filter(ls => {
        return ls !== null;
      });
  }

  nextChildIndex() {
    return this.index.concat([this.points.length]);
  }

  drawPointToCanvas(point, prec, layer, projection) {
    let p = projection.posn(point);
    let p1, p2;

    if (prec && prec.sHandle) {
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
        layer.moveTo(projection.posn(point));
      } else {
        this.drawPointToCanvas(point, prec, layer, projection);
      }
    }

    if (this.closed) {
      // Re-draw first point
      let point = this.points[0];
      let prec = this.points[this.points.length - 1];

      this.drawPointToCanvas(point, prec, layer, projection);
    }
  }
}
