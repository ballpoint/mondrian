import 'util/prototypes';
import Path from 'geometry/path';
import PathPoint from 'geometry/path-point';
import shapes from 'lab/shapes';
import LineSegment from 'geometry/line-segment';
import CubicBezier from 'geometry/cubic-bezier-line-segment';
import PointsList from 'geometry/points-list'

export class Edge {
  constructor(origin, destination, twin) {
    this.origin = origin;
    this.destination = destination;

    if (twin === undefined) {
      twin = new Edge(destination, origin, this);
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

    /*
    // Intersections now sorted
    for (let xn of xns.concat([this.destination])) {
      let edge = new Edge(origin, xn, this.isTwin);
      edge.prev = prev;
      prev.next = edge;
      edges.push(edge);
      prev = edge;
      origin = xn;
    }
    */

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
    this.edges = this.edges.filter((edge) => {
      return edge !== remove;
    }).concat(replacements);
  }

  get twins() {
    return this.edges.map((edge) => { return edge.twin });
  }

  intersect(os) {
    let thisEdges = this.edges.slice(0);
    let otherEdges = os.edges.slice(0);

    let xnsAll = [];

    for (let edge of thisEdges) {
      for (let other of otherEdges) {
        let xns = edge.intersections(other);
        if (xns && xns.length > 0) {
          // We have intersections to deal with
          let replacementsSelf = [];
          let replacementsOther = [];

          //console.log(edge.toString())
          //console.log(other.toString());
          //console.log(xns.join(' '));

          // Fix this set
          this.replace(edge, edge.splitOn(xns));

          // Fix the other set
          os.replace(other, other.splitOn(xns));

          xnsAll = xnsAll.concat(xns);
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

  function includePoint(pt, owner, other) {
    // We always keep intersection points
    for (let xn of xns) {
      if (xn.equal(pt)) return true;
    }

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
    return includePoint(edge.origin, owner, other) && includePoint(edge.destination, owner, other);
  }

  let pl = new PointsList();

  let edgesToUse = [];
  let edgesUsed = [];
  for (let edge of aes.edges) {
    if (includeEdge(edge, a, b)) {
      edgesToUse.push(edge);
      edgesToUse.push(edge.twin);
    }
  }
  for (let edge of bes.edges) {
    if (includeEdge(edge, b, a)) {
      edgesToUse.push(edge);
      edgesToUse.push(edge.twin);
    }
  }

  console.log(edgesToUse, 'to use');
  for (let edge of edgesToUse) {
    console.log(edge.toString());
  }

  if (edgesToUse.length === 0) {
    console.warn('Empty boolean result');
    return pl;
  }

  // Start with the first edge and crawl
  let cursor = edgesToUse[0];
  pl.push(cursor.origin);
  console.log('start at', cursor.origin.toString());

  let iters = edgesToUse.length/2;

  for (let i = iters; i > 0; i--) {
    // Push current destination and go on to find the next
    if (pl.first.equal(cursor.destination) && edgesUsed.indexOf(cursor.next) > -1) {
      console.log('closing to', cursor.destination.toString());
      pl.closeSegment();
    } else {
      pl.push(cursor.destination);
      console.log('push', cursor.destination.toString(), '('+cursor.toString()+')');
    }

    console.log('bf rm', edgesToUse.length);
    edgesToUse = edgesToUse.remove(cursor);
    edgesToUse = edgesToUse.remove(cursor.twin);
    console.log('af rm', edgesToUse.length);

    edgesUsed.push(cursor);

    if (edgesToUse.length === 0) {
      break;
    }

    if (edgesToUse.indexOf(cursor.next) > -1) {
      // If cursor.next or its twin is an edge we want to use, just use it
      console.log('using next');
      cursor = cursor.next;
      /*
    } else if (edgesToUse.indexOf(cursor.next.twin) > -1) {
      console.log('using next twin');
      cursor = cursor.next.twin;
      */
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
