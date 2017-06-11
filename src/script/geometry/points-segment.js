import {
  MoveTo,
  LineTo,
  HorizTo,
  VertiTo,
  CurveTo,
  SmoothTo,
} from 'geometry/point';
import PathPoint from 'geometry/path-point';

import Point from 'geometry/point';
/*

  PointsSegment

  A segment of points that starts with a MoveTo.
  A PointsList is composed of a list of these.

*/


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
    this.startsAt = this.points.length !== 0 ? this.points[0].at : 0;

    if (this.list != null) {
      this.owner = this.list.owner;
    }

    if (this.points[0] instanceof MoveTo) {
      this.moveTo = this.points[0];
    }
  }

  get length() {
    return this.points.length;
  }

  insert(point, at) {
    let head = this.points.slice(0, at);
    let tail = this.points.slice(at);

    if (point instanceof Array) {
      tail.forEach(p => p.at += point.length);

      return head = head.concat(point);

    } else if (point instanceof Point) {
      tail.forEach(p => p.at += 1);

      head[head.length - 1].setSucc(point);
      tail[0].setPrec(point);

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
  }

  close() {
    // Check if first point and last point are close or identical and
    // reduce them to one.
    let firstPoint = this.points[0];
    let lastPoint  = this.points[this.points.length-1];

    if (firstPoint.distanceFrom(lastPoint) < 0.1) {
      if (lastPoint.pHandle) {
        firstPoint.setPHandle(lastPoint.pHandle.x, lastPoint.pHandle.y);
      }
      this.points = this.points.slice(0, this.points.length-1);
      this.closed = true;
    }
  }

  empty() {
    return this.points.length === 0;
  }

  toString() {
    return this.points.join(' ');
  }


  at(n) {
    return this.points[n - this.startsAt];
  }


  remove(x) {
    // Relink things
    x.prec.succ = x.succ;
    x.succ.prec = x.prec;
    if (x === this.list.last) {
      this.list.last = x.prec;
    }
    if (x === this.list.first) {
      this.list.first = x.succ;
    }
    this.points = this.points.remove(x);

    // Remove it from the canvas if it's there
    return x.remove();
  }

  replace(old, replacement) {
    if (replacement instanceof Point) {
      replacement.inheritPosition(old);
      this.points = this.points.replace(old, replacement);

    } else if (replacement instanceof Array) {
      let replen = replacement.length;
      let { at } = old;
      let { prec } = old;
      let { succ } = old;
      old.succ.prec = replacement[replen - 1];
      // Sus
      for (let np of Array.from(replacement)) {
        np.owner = this.owner;

        np.at = at;
        np.prec = prec;
        np.succ = succ;
        prec.succ = np;
        prec = np;
        at += 1;
      }

      this.points = this.points.replace(old, replacement);

      for (let p of Array.from(this.points.slice(at))) {
        p.at += (replen - 1);
      }
    }

    return replacement;
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
      layer.bezierCurveTo(p1, p2, p);
    } else {
      layer.lineTo(p);
    }
  }

  drawToCanvas(layer, context, projection) {
    if (!(this.points[0] instanceof PathPoint)) {
      return;
    }
    let prec;
    for (let i = 0; i < this.points.length; i++) {
      let point = this.points[i];
      let p = projection.posn(point);
      if (i === 0) {
        layer.moveTo(projection.posn(point))
      } else {
        this.drawPointToCanvas(point, prec, layer, projection);
      }

      prec = point;
    }

    if (this.closed) {
      // Re-draw first point
      let point = this.points[0];
      let prec = this.points[this.points.length-1];

      this.drawPointToCanvas(point, prec, layer, projection);
    }
  }

}
