import conversions from 'lab/conversions';
import PointsSegment from 'geometry/points-segment';
import Point from 'geometry/point';
import PathPoint from 'geometry/path-point';
import {
  MoveTo,
  LineTo,
  CurveTo,
} from 'geometry/point';


//  PointsList

export default class PointsList {
  static initClass() {
  
    this.prototype.first = null;
    this.prototype.last = null;
  
    this.prototype.firstSegment = null;
    this.prototype.lastSegment = null;
  
    this.prototype.closed = false;
  }

  constructor(segments=[]) {
    this.segments = segments;
  }

  static commandsFromString(string) {
    // Split a path data string like "M204,123 C9023........."
    // into an array of separate string commands
    let commands = [];
    let currentMatch;

    for (let i = 0; i < string.length; i ++) {
      let char = string[i];
      if (/[A-Z]/i.test(char)) {
        if (currentMatch) {
          commands.push(currentMatch)
        }
        currentMatch = '';
      }
      currentMatch += char;
    }

    if (currentMatch.length > 0) {
      commands.push(currentMatch)
    }

    return commands;
  }

  static fromStringX(string, owner) {
    let list = new PointsList([]);
    let currentSegment = new PointsSegment([], list);

    let commands = this.commandsFromString(string);

    let previous;

    for (let str of commands) {
      let command = str[0];

      switch (command.toLowerCase()) {
        case 'z':
          // TODO: TREAT AS LINETO;
          break;
        case 'm':
          // Start new segment
          list.push(currentSegment);
          currentSegment = new PointsSegment([], list);
      }

      let points = PathPoint.fromString(str, previous);

      console.log(str, points);

      for (let point of points) {
        currentSegment.push(point);
        previous = point;
      }
    }

    list.push(currentSegment);

    return list;
  }

  static fromString(string, path) {
    // Given a d="M204,123 C9023........." string,
    // return an array of Points.

    let list = new PointsList([]);

    let previous = undefined;

    let matches = [];
    let currentMatch;

    for (let i = 0; i < string.length; i ++) {
      let char = string[i];
      if (/[A-Z]/i.test(char)) {
        if (currentMatch) {
          matches.push(currentMatch)
        }
        currentMatch = '';
      }
      currentMatch += char;
    }

    if (currentMatch.length > 0) {
      matches.push(currentMatch)
    }

    let currentSegment = new PointsSegment([], list);

    for (let point of matches) {
      if (point === 'z') {
        currentSegment.closed = true;
        continue;
      }

      // Point's constructor decides what kind of subclass to make
      // (MoveTo, CurveTo, etc)
      let ps = Point.fromString(point, previous);

      for (let p of ps) {
        // Maintain ownership
        p.setOwner(path);

        if (p instanceof MoveTo) {
          if (!currentSegment.empty()) {
            list.pushSegment(currentSegment);
            currentSegment = new PointsSegment([], list);
          }
        }

        p._i = currentSegment.length;

        if (p instanceof Point) {
          if (previous != null && currentSegment.points.has(previous)) {
            previous.setSucc(p);
          }

          previous = p; // Set it for the next point

          // Don't remember why I did this.
          /*
          if ((p instanceof SmoothTo) && (owner instanceof Point)) {
            p.setPrec(owner);
          }
          */

          currentSegment.push(p);
        }
      }
    }

    list.pushSegment(currentSegment);

    return list;
  }


  pushSegment(segment) {
    this.segments.push(segment);
  }

  moveSegmentToFront(segment) {
    if (!(this.segments.has(segment))) { return; }
    return this.segments = this.segments.cannibalizeUntil(segment);
  }

  movePointToFront(point) {
    this.moveSegmentToFront(point.segment);
    return point.segment.movePointToFront(point);
  }


  firstPointThatEquals(point) {
    return this.filter(p => p.equal(point))[0];
  }


  closedOnSameSpot() {
    return this.closed && (this.last.equal(this.first));
  }


  length() {
    return this.segments.reduce((a, b) => a + b.points.length
    , 0);
  }


  all() {
    let pts = [];
    for (let s of Array.from(this.segments)) {
      pts = pts.concat(s.points);
    }
    return pts;
  }

  pushSegment(sgmt) {
    this.lastSegment = sgmt;
    return this.segments.push(sgmt);
  }

  push(point, after) {
    // Add a new point!

    if (this.segments.length === 0) {
      this.pushSegment(new PointsSegment([], this));
    }

    if ((after == null)) {
      point.at = this.lastSegment.points.length;
      this.lastSegment.push(point);

      /*
      if (this.last != null) {
        this.last.setSucc(point);
        point.setPrec(this.last);
      } else {
        point.setPrec(point);
      }

      if (this.first != null) {
        this.first.setPrec(point);
        point.setSucc(this.first);
      } else {
        point.setSucc(point);
      }
      */
      this.last = point;

      return this;
    }
  }


  replace(old, replacement) {
    return this.segmentContaining(old).replace(old, replacement);
  }


  reverse() {
    // Reverse the order of the points, while maintaining the exact same shape.
    return new PointsList([], this.segments.map(s => s.reverse()));
  }


  at(n) {
    return this.segmentContaining(parseInt(n, 10)).at(n);
  }

  close() {
    this.closed = true;
    return this;
  }

  relative() {
    this.segments = this.segments.map(function(s) {
      s.points = s.points.map(function(p) {
        let abs = p.relative();
        abs.inheritPosition(p);
        return abs;
      });
      return s;
    });
    return this;
  }

  removeBasePoints() {
    this.map(p => p.baseHandle != null ? p.baseHandle.remove() : undefined);
    return this;
  }


  hide() {
    return this.map(p => p.hide());
  }

  unhover() {
    return this.map(p => p.unhover());
  }

  join(x) {
    return this.all().join(x);
  }

  segmentContaining(a) {
    if (typeof a === "number") {
      let segm;
      for (let s of Array.from(this.segments)) {
        if (s.startsAt <= a) {
          segm = s;
        } else { break; }
      }
      return segm;
    } else {
      let segments = this.segments.filter(s => s.points.indexOf(a) > -1);
      if (segments.length === 1) { return segments[0]; }
    }
    return [];
  }


  hasPointWithin(tolerance, point) {
    return this.filter(p => p.within(tolerance, point)).length > 0;
  }


  remove(x) {
    if (typeof x === "number") {
      x = this.at(x);
    }
    if (x instanceof Array) {
      return Array.from(x).map((p) =>
        this.remove(p));
    } else if (x instanceof Point) {
      return this.segmentContaining(x).remove(x);
    }
  }

  filter(fun) {
    return this.all().filter(fun);
  }

  filterSegments(fun) {
    return this.segments.map(segment => new PointsSegment(segment.points.filter(fun)));
  }

  fetch(cl) {
    // Given a class like MoveTo or CurveTo or Point or CurvePoint,
    // return all points of that class.
    return this.all().filter(p => p instanceof cl);
  }

  map(fun) {
    return this.segments.map(s => s.points.map(fun));
  }

  forEach(fun) {
    return this.segments.forEach(s => s.points.forEach(fun));
  }

  mapApply(fun) {
    return this.segments.map(s => s.points = s.points.map(fun));
  }

  xRange() {
    let xs = this.all().map(p => p.x);
    return new Range(Math.min.apply(this, xs), Math.max.apply(this, xs));
  }

  yRange() {
    let ys = this.all().map(p => p.y);
    return new Range(Math.min.apply(this, ys), Math.max.apply(this, ys));
  }

  toString() {
    return this.segments.join(' ') + (this.closed ? "z" : "");
  }

  insideOf(other) {
    return this.all().filter(p => p.insideOf(other));
  }

  notInsideOf(other) {
    return this.all().filter(p => !p.insideOf(other));
  }

  withoutMoveTos() {
    return new PointsList([], this.filterSegments(p => !(p instanceof MoveTo)));
  }
}
PointsList.initClass();

