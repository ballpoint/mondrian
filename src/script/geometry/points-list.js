import PointsSegment from 'geometry/points-segment';
import PathPoint from 'geometry/path-point';
import Range from 'geometry/range';
import Bounds from 'geometry/bounds';

//  PointsList

export default class PointsList {
  constructor(segments = [], path) {
    this.segments = segments;

    // Ensure at least one segment
    if (this.segments.length === 0) {
      this.pushSegment(new PointsSegment([], this));
    }

    this.path = path;
    for (let segment of segments) {
      segment.list = this;
    }
  }

  static commandsFromString(string) {
    // Split a path data string like "M204,123 C9023........."
    // into an array of separate string commands
    let commands = [];
    let currentMatch;

    for (let i = 0; i < string.length; i++) {
      let char = string[i];
      if (/[amlcshv]/i.test(char)) {
        if (currentMatch) {
          commands.push(currentMatch);
        }
        currentMatch = '';
      }
      currentMatch += char;
    }

    if (currentMatch.length > 0) {
      commands.push(currentMatch);
    }

    return commands;
  }

  static fromString(string, path) {
    let list = new PointsList([], path);

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

      for (let point of points) {
        list.push(point);
        previous = point;
      }
    }

    if (list.lastSegment.firstPointLastPointEqual()) {
      list.closeSegment();
    }

    return list;
  }

  clone() {
    return new PointsList(
      this.segments.map(s => {
        return s.clone();
      })
    );
  }

  get firstSegment() {
    return this.segments[0];
  }

  get lastSegment() {
    return this.segments[this.segments.length - 1];
  }

  get first() {
    return this.firstSegment.first;
  }

  get last() {
    return this.lastSegment.last;
  }

  lineSegments() {
    return this.segments.reduce((a, b) => {
      return a.concat(b.lineSegments());
    }, []);
  }

  pushSegment(segment) {
    this.segments.push(segment);
  }

  nonEmptySegments() {
    return this.segments.filter(seg => {
      return !seg.empty;
    });
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

  get empty() {
    return this.all().length === 0;
  }

  indexOf(item) {
    if (item instanceof PointsSegment) {
      return this.segments.indexOf(item);
    } else if (item instanceof PathPoint) {
      return this.all().indexOf(item);
    }
  }

  push(point) {
    // Add a new point!
    this.lastSegment.push(point);
    return this;
  }

  insert(segment, i) {
    this.segments = this.segments.insertAt(segment, i);
  }

  closeSegment() {
    if (this.lastSegment && !this.lastSegment.empty) {
      this.lastSegment.close();
      this.pushSegment(new PointsSegment([], this));
    }
  }

  reverse() {
    // Reverse the order of the points, while maintaining the exact same shape.
    return new PointsList([], this.segments.map(s => s.reverse()));
  }

  i(n) {
    n = parseInt(n, 10);
    return this.segmentContaining(n).i(n);
  }

  join(x) {
    return this.all().join(x);
  }

  segmentContaining(a) {
    if (typeof a === 'number') {
      let segm;
      for (let s of Array.from(this.segments)) {
        if (s.startsAt <= a) {
          segm = s;
        } else {
          break;
        }
      }
      return segm;
    } else {
      let segments = this.segments.filter(s => s.points.indexOf(a) > -1);
      if (segments.length === 1) {
        return segments[0];
      }
    }
    return [];
  }

  hasPointWithin(tolerance, point) {
    return this.filter(p => p.within(tolerance, point)).length > 0;
  }

  removeSegment(segment) {
    this.segments = this.segments.filter(s => {
      return s !== segment;
    });
  }

  remove(x) {
    if (typeof x === 'number') {
      x = this.i(x);
    }
    if (x instanceof Array) {
      return Array.from(x).map(p => this.remove(p));
    } else if (x instanceof Point) {
      return this.segmentContaining(x).remove(x);
    }
  }

  replaceSegment(old, replacements) {
    let i = this.segments.indexOf(old);
    if (i === -1) return;

    this.segments = this.segments
      .slice(0, i)
      .concat(replacements)
      .concat(this.segments.slice(i + 1));
  }

  split(segmentIndex, pointIndex) {
    // Given segment index and point index, split segment
    // at that index and replace it with the result
    let segment = this.segments[segmentIndex];
    let newSegments = segment.split(pointIndex);

    newSegments[0].list = this;
    newSegments[1].list = this;

    this.replaceSegment(segment, newSegments);
  }

  popSlice(segmentIndex, pointIndex) {
    let segment = this.segments[segmentIndex];
    let sliced = segment.popSlice(pointIndex);

    return new PointsList([sliced]);
  }

  filter(fun) {
    return this.all().filter(fun);
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
    return this.segments.map(s => (s.points = s.points.map(fun)));
  }

  xRange() {
    let xs = this.all().map(p => p.x);
    return new Range(Math.min.apply(this, xs), Math.max.apply(this, xs));
  }

  yRange() {
    let ys = this.all().map(p => p.y);
    return new Range(Math.min.apply(this, ys), Math.max.apply(this, ys));
  }

  get ranges() {
    let lineSegments = this.lineSegments();

    let xrs = Range.fromList(
      lineSegments.map(ls => {
        return ls.xRange();
      })
    );
    let yrs = Range.fromList(
      lineSegments.map(ls => {
        return ls.yRange();
      })
    );
    return { xrs, yrs };
  }

  bounds() {
    let { xrs, yrs } = this.ranges;
    return (this.boundsCached = new Bounds(
      xrs.min,
      yrs.min,
      xrs.length(),
      yrs.length()
    ));
  }

  toSVGString() {
    return this.segments
      .map(s => {
        return s.toSVGString();
      })
      .join(' ');
  }
}
