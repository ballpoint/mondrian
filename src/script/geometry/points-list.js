import PointsSegment from 'geometry/points-segment';
import PathPoint from 'geometry/path-point';

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

  static fromString(string, owner) {
    let list = new PointsList([]);

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
          list.closeSegment();
      }

      let points = PathPoint.fromString(str, previous);

      console.log(str, points);

      for (let point of points) {
        list.push(point);
        previous = point;
      }
    }

    return list;
  }

  pushSegment(segment) {
    this.lastSegment = segment;
    this.segments.push(segment);
  }

  movePointToFront(point) {
    this.moveSegmentToFront(point.segment);
    return point.segment.movePointToFront(point);
  }

  length() {
    return this.all().length;
  }

  all() {
    return this.segments.reduce((a, b) => a.concat(b.points), []);
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

  closeSegment() {
    if (this.lastSegment) {
      this.lastSegment.close();
    }
    this.pushSegment(new PointsSegment([], this));
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

