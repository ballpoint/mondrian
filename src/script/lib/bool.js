import 'util/prototypes';
import Path from 'geometry/path';
import PathPoint from 'geometry/path-point';
import shapes from 'lab/shapes';
import LineSegment from 'geometry/line-segment';
import CubicBezier from 'geometry/cubic-bezier-line-segment';
import PointsList from 'geometry/points-list'

const XN_TOLERANCE = 0.001;

export class Edge {
  constructor(origin, destination, twin) {
    this.origin = origin;
    this.destination = destination;

    if (twin === undefined) {
      twin = new Edge(destination.reverse(), origin.reverse(), this);
    }
    this.twin = twin;
  }

  get lineSegment() {
    try {
    return this.destination.toLineSegment(this.origin);
    } catch(e) { debugger; }
  }

  intersections(other) {
    let lsa = this.lineSegment;
    let lsb = other.lineSegment;

    return shapes.intersections(lsa, lsb);
  }

  splitOn(xns) {
    let xIncr = this.origin.x < this.destination.x;

    xns.sort((a, b) => {
      if (xIncr) {
        return a.x - b.x;
      } else {
        return b.x - a.x;
      }
    });

    let ls = this.lineSegment;

    let edges = [];
    let prev = this.prev;
    let origin = this.origin;
    let splits;
    let finalDestination;

    for (let xn of xns) {
      splits = ls.splitAt(xn);

      let dest;

      if (ls instanceof CubicBezier) {
        origin = PathPoint.fromPosns(splits[0].p1, origin.pHandle, splits[0].p2);
        dest   = PathPoint.fromPosns(splits[1].p1, splits[0].p3, splits[1].p2);
        finalDestination = PathPoint.fromPosns(splits[1].p4, splits[1].p3, this.destination.sHandle);
      } else {
        origin = PathPoint.fromPosns(splits[0].a);
        dest   = PathPoint.fromPosns(splits[0].b);
        finalDestination = PathPoint.fromPosns(splits[1].b);
      }


      // Keep the rest for the next split
      ls = splits[1];

      let edge = new Edge(origin, dest, this.isTwin);
      edge.prev = prev;
      prev.next = edge;
      edges.push(edge);
      prev = edge;
    }


    // Add final edge
    let lastEdge = edges.last();
    let edge = new Edge(lastEdge.destination, finalDestination);
    lastEdge.next = edge;
    edge.prev = prev;
    edge.next = this.next;
    edges.push(edge);

    debugger;

    // Link up twins
    for (let edge of edges) {
      edge.twin.prev = edge.next.twin;
      edge.twin.next = edge.prev.twin;
    }

    return edges;
  }

  toString() {
    return this.origin.toString() + ' -> ' + this.destination.toString();
  }
}

export class EdgeSet {
  constructor(edges=[]) {
    this.edges = edges;
  }

  get length() {
    return this.edges.length;
  }

  get(i) {
    return this.edges[i];
  }

  static linkEdges(edges) {
    for (let i = 0; i < edges.length; i++) {
      let edge = edges[i];
      let prev = edges[i-1];
      let next = edges[i+1];
      if (i === 0) {
        prev = edges[edges.length-1];
      } else if (i === edges.length-1) {
        next = edges[0];
      }
      edge.prev = prev;
      edge.next = next;

      edge.twin.next = prev.twin;
      edge.twin.prev = next.twin;
    }
  }

  static fromPointsList(pl) {
    let segments = pl.segments.map((seg) => {
      return seg.points.map((pt) => {
        // Going in default dir
        return new Edge(pt.clone(), pt.succ.clone());
      })
    });

    for (let seg of segments) {
      this.linkEdges(seg);
    }

    let edges = segments.reduce((a, b) => {
      return a.concat(b);
    }, []);

    return new EdgeSet(edges);

  }

  static fromPath(path) {
    return this.fromPointsList(path.points);
  }

  replace(remove, replacements) {
    console.log('replacing', remove.toString(), 'with', replacements[0].toString(), ';\n', 'pushing', replacements[1].toString());
    let i = this.edges.indexOf(remove);
    this.edges[i] = replacements[0];
    this.edges.push(replacements[1]);
    return replacements[0];
  }

  get twins() {
    return this.edges.map((edge) => { return edge.twin });
  }

  intersect(os) {
    let xnsAll = [];

    for (let i = 0; i < this.edges.length; i ++) {
      let edge = this.edges[i];

      for (let ii = 0; ii < os.edges.length; ii ++) {
        let other = os.edges[ii];
        if (i > 1000 || ii > 1000) {
          break;
        }
        let xns = edge.intersections(other);

        if (xns instanceof Array) {

          xns = xns.filter((xn) => {
            // TODO constantize that shit
            return !(
              xn.within(edge.origin, XN_TOLERANCE) ||
              xn.within(edge.destination, XN_TOLERANCE) ||
              xn.within(other.origin, XN_TOLERANCE) ||
              xn.within(other.destination, XN_TOLERANCE)
            );
            console.log('omitting further split; point is incident');
          });

          if (xns.length > 0) {

            //console.log(edge.toString())
            //console.log(other.toString());
            //console.log(xns.join(' '));

            console.log('split', xns.join(' '), '|',  edge.toString(), '|',  other.toString());

            // Fix this set
            edge = this.replace(edge, edge.splitOn(xns));

            // Fix the other set
            os.replace(other, other.splitOn(xns));

            xnsAll = xnsAll.concat(xns);
          }
        }
      }
    }

    return xnsAll;
  }
};

function doBoolean(a, b, op) {
  console.log('a', a, 'b', b);

  let aes = EdgeSet.fromPointsList(a);
  let bes = EdgeSet.fromPointsList(b);

  // Resolve intersections
  let xns = aes.intersect(bes);

  console.log('xns', xns);

  function wasIntersection(pt) {
    for (let xn of xns) {
      if (xn.equal(pt)) return true;
    }
    return false;
  }

  function includePoint(pt, owner, other) {
    // We always keep intersection points
    if (wasIntersection(pt)) return true;

    switch (op) {
      case 'unite':
        // In the case of union, we only keep points not inside
        // the other shape.
        return !shapes.contains(other, pt);
      case 'intersect':
        return shapes.contains(other, pt);
      case 'subtract':
        switch (owner) {
          case a:
            return shapes.contains(b, pt);
          case b:
            return !shapes.contains(a, pt);
        }
    }
  }

  function includeEdge(edge, owner, other) {
    // TODO debug from here next time... double intersection
    // need to figure out consistent way to handle this
    if (wasIntersection(edge.origin) && wasIntersection(edge.destination)) {
      let midpt = edge.lineSegment.posnAt(0.5);
      switch (op) {
        case 'unite':
          return !shapes.contains(other, midpt);
        case 'subtract':
          if (owner === a) {
            return shapes.contains(b, midpt);
          } else {
            return !shapes.contains(a, midpt);
          }
        case 'intersect':
          return shapes.contains(other, midpt);
      }
    }

    return (
      includePoint(edge.origin, owner, other) &&
      includePoint(edge.destination, owner, other)
    );
  }

  let pl = new PointsList();

  let edgesToUse = [];
  let edgesUsed = [];
  let edgesToOmit = [];
  for (let edge of aes.edges) {
    if (includeEdge(edge, a, b)) {
      edgesToUse.push(edge);
      edgesToUse.push(edge.twin);
    } else {
      edgesToOmit.push(edge);
    }
  }
  for (let edge of bes.edges) {
    if (includeEdge(edge, b, a)) {
      edgesToUse.push(edge);
      edgesToUse.push(edge.twin);
    } else {
      edgesToOmit.push(edge);
    }
  }

  console.log('total edges', (edgesToUse.length/2) + edgesToOmit.length);

  console.log(edgesToUse, 'to use', edgesToUse.length/2);
  for (let edge of edgesToUse) {
    console.log(edge.toString());
  }
  console.log(edgesToOmit, 'to omit', edgesToOmit.length);
  for (let edge of edgesToOmit) {
    console.log(edge.toString());
  }

  if (edgesToUse.length === 0) {
    console.warn('Empty boolean result');
    return pl;
  }

  // Start with the first edge and crawl
  let cursor = edgesToUse[0];
  let prevEdge;
  pl.push(cursor.origin);
  console.log('start at', cursor.origin.toString());

  let iters = edgesToUse.length/2;

  for (let i = iters; i > 0; i--) {
    let seg = pl.lastSegment;

    // Push current destination and go on to find the next
    if (seg.length > 0 && seg.first.equal(cursor.destination) && edgesUsed.indexOf(cursor.next) > -1) {
      pl.closeSegment();

      if (seg.length > 1) {
        let lastPoint = seg.last;
        lastPoint.setSHandle(cursor.origin.sHandle);

        let firstPoint = seg.first;
        firstPoint.setPHandle(cursor.destination.pHandle);
      }

    } else {
      seg.push(cursor.destination);
      console.log('push', cursor.destination.toString(), '('+cursor.toString()+')');

      // Set the last point's sHandle
      if (seg.length > 1) {
        let prevPoint = seg.points[seg.length-2];
        prevPoint.setSHandle(cursor.origin.sHandle);
      }
    }

    edgesToUse = edgesToUse.remove(cursor);
    edgesToUse = edgesToUse.remove(cursor.twin);

    edgesUsed.push(cursor);
    prevEdge = cursor;

    if (edgesToUse.length === 0) {
      break;
    }

    if (edgesToUse.indexOf(cursor.next) > -1) {
      // If cursor.next or its twin is an edge we want to use, just use it
      cursor = cursor.next;
    } else {
      // Otherwise, we are at an intersection and must seek out
      // which common edge we want instead (going clockwise)

      let cursorOpts = [];
      for (let edge of edgesToUse) {
        // TODO optimize this lookup
        if (edge.origin.equal(cursor.destination)) {
          cursorOpts.push(edge);
        }
      }

      if (cursorOpts.length === 1) {
        console.log('using only cursorOpts');
        cursor = cursorOpts[0];
      } else if (cursorOpts.length == 0) {
        // The current segment is closed and we need to pick an edge that's remaining
        // to continue in a new segment.
        console.log('closing and moving on');
        pl.closeSegment();

        cursor = edgesToUse[0];
      } else {
        // TODO handle this case!
        console.log('opts not 1 with edges left', cursor);
        debugger;
        break;
      }
    }
  }

  pl.closeSegment();

  return pl;
};

function doQueue(queue, op) {
  console.log(queue, op);
  let result = queue[0];
  queue = queue.slice(1);

  while (queue.length > 0) {
    result = doBoolean(result, queue[0], op);
    queue = queue.slice(1);
  }

  return result;
}

export default {
  unite(elems) { 
    return doQueue(elems, 'unite');
  },
  intersect(elems) { 
    return doQueue(elems, 'intersect');
  },
  subtract(elems) { 
    return doQueue(elems, 'subtract');
  },
};
