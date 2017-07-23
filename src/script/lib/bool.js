import 'util/prototypes';
import logger from 'lib/logger';
import Path from 'geometry/path';
import PathPoint from 'geometry/path-point';
import shapes from 'lab/shapes';
import { OUTSIDE, INCIDENT, INSIDE } from 'lab/shapes';
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

  equal(other) {
    return this.origin.fullEqual(other.origin) && this.destination.fullEqual(other.destination);
  }

  intersections(other) {

    let lsa = this.lineSegment;
    let lsb = other.lineSegment;

    //console.log(this.toString(), other.toString(), shapes.intersections(lsa, lsb));

    return shapes.intersections(lsa, lsb);
  }

  splitOn(xns) {
    xns = xns.filter((xn) => {
      return !(xn.within(this.origin, XN_TOLERANCE) || xn.within(this.destination, XN_TOLERANCE));
    });

    if (xns.length === 0) {
      return [this];
    }

    xns.sort((a, b) => {
      let pa = this.lineSegment.findPercentageOfPoint(a);
      let pb = this.lineSegment.findPercentageOfPoint(b);
      return pa - pb;
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

    // Link up twins
    for (let edge of edges) {
      edge.twin.prev = edge.next.twin;
      edge.twin.next = edge.prev.twin;
    }

    return edges;
  }

  toString() {
    return this.origin.toShortString() + ' -> ' + this.destination.toShortString();
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
    if (replacements.length === 1 && replacements[0] === remove) return remove; // no work to do!

    logger.verbose('replacing', remove.toString(), 'with', replacements[0].toString(), '\n', 'pushing', replacements.slice(1).join('; '));
    let i = this.edges.indexOf(remove);
    this.edges[i] = replacements[0];

    for (let rep of replacements.slice(1)) {
      this.edges.push(rep);
    }
    return replacements[0];
  }

  remove(edge) {
    let i = this.edges.indexOf(edge);
    if (i > -1) {
      this.edges = this.edges.removeIndex(i);
    }
  }

  get twins() {
    return this.edges.map((edge) => { return edge.twin });
  }

  intersect(os) {
    let xnsAll = [];

    let xnsSelf = {};
    let xnsOther = {};

    for (let i = 0; i < this.edges.length; i ++) {
      let edge = this.edges[i];

      for (let ii = 0; ii < os.edges.length; ii ++) {
        let other = os.edges[ii];

        if (edge.equal(other)) {
          // In the event of two identical edges, we only keep one
          os.remove(other);
        } else {
          // Otherwise, look for intersections
          let xns = edge.intersections(other);

          if (xns instanceof Array && xns.length > 0) {

            if (xnsSelf[i] === undefined) {
              xnsSelf[i] = xns;
            } else {
              xnsSelf[i] = xnsSelf[i].concat(xns);
            }

            if (xnsOther[ii] === undefined) {
              xnsOther[ii] = xns;
            } else {
              xnsOther[ii] = xnsOther[ii].concat(xns);
            }

            xnsAll = xnsAll.concat(xns);
          }
        }
      }
    }

    for (let i = 0; i < this.edges.length; i ++) {
      let edge = this.edges[i];

      let edgeXns = xnsSelf[i];
      if (edgeXns) {
        this.replace(edge, edge.splitOn(edgeXns));
      }
    }

    for (let i = 0; i < os.edges.length; i ++) {
      let edge = os.edges[i];

      let edgeXns = xnsOther[i];
      if (edgeXns) {
        os.replace(edge, edge.splitOn(edgeXns));
      }
    }

    return xnsAll;
  }
};

function doBoolean(a, b, op) {
  logger.verbose('a', a, 'b', b);

  let aes = EdgeSet.fromPointsList(a);
  let bes = EdgeSet.fromPointsList(b);

  // Resolve intersections
  let xns = aes.intersect(bes);

  logger.verbose('xns', xns);

  function wasIntersection(pt, other) {
    //let rel = shapes.relationship(other, pt);
    //return rel == INCIDENT;
    for (let xn of xns) {
      if (xn.equal(pt)) return true;
    }
    return false;
  }

  function includePoint(pt, owner, other) {
    // We always keep intersection points
    if (wasIntersection(pt, other)) return true;

    let rel;

    switch (op) {
      case 'unite':
        // In the case of union, we only keep points not inside
        // the other shape.
        rel = shapes.relationship(other, pt);
        return rel != INSIDE;
      case 'intersect':
        rel = shapes.relationship(other, pt);
        return rel == INSIDE || rel == INCIDENT;
      case 'subtract':
        switch (owner) {
          case a:
            rel = shapes.relationship(b, pt);
            return rel == INSIDE;
          case b:
            rel = shapes.relationship(a, pt);
            return rel == OUTSIDE;
        }
    }
  }

  function includeEdge(edge, owner, other) {
    if (wasIntersection(edge.origin, other) && wasIntersection(edge.destination, other)) {
      let midpt = edge.lineSegment.posnAt(0.5);
      let rel;
      switch (op) {
        case 'unite':
          rel = shapes.relationship(other, midpt);
          return rel == OUTSIDE;
        case 'subtract':
          if (owner === a) {
            rel = shapes.relationship(b, midpt);
            return rel == INSIDE;
          } else {
            rel = shapes.relationship(a, midpt);
            return rel == OUTSIDE;
          }
        case 'intersect':
          rel = shapes.relationship(other, midpt);
          return rel == INSIDE;
      }
    }


    /*
    console.log(
      edge.origin,
      includePoint(edge.origin, owner, other),
      edge.destination,
      includePoint(edge.destination, owner, other)
    )
    */

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

  logger.verbose('total edges', (edgesToUse.length/2) + edgesToOmit.length);

  logger.verbose(edgesToUse, 'to use', edgesToUse.length/2);
  for (let edge of edgesToUse) {
    logger.verbose(edge.toString());
  }
  logger.verbose(edgesToOmit, 'to omit', edgesToOmit.length);
  for (let edge of edgesToOmit) {
    logger.verbose(edge.toString());
  }

  if (edgesToUse.length === 0) {
    console.warn('Empty boolean result');
    return pl;
  }

  // Start with the first edge and crawl
  let cursor = edgesToUse[0];
  let prevEdge;
  pl.push(cursor.origin);
  logger.verbose('-------------');
  logger.verbose('start at', cursor.origin.toShortString());

  let iters = edgesToUse.length/2;

  for (let i = iters; i > 0; i--) {
    let seg = pl.lastSegment;

    // Push current destination and go on to find the next
    if (seg.length > 0 && seg.first.equal(cursor.destination) && edgesUsed.indexOf(cursor.next) > -1) {
      pl.closeSegment();

      if (seg.length > 1) {
        let lastPoint = seg.last;
        if (cursor.origin.sHandle) {
          lastPoint.setSHandle(cursor.origin.sHandle);
        } else {
          lastPoint.unsetHandle('sHandle');
        }

        let firstPoint = seg.first;
        if (cursor.destination.pHandle) {
          firstPoint.setPHandle(cursor.destination.pHandle);
        } else {
          firstPoint.unsetHandle('pHandle');
        }
      }
    } else {
      seg.push(cursor.destination);
      logger.verbose('push', cursor.destination.toShortString(), '('+cursor.toString()+')');

      // Set the last point's sHandle
      if (seg.length > 1) {
        let prevPoint = seg.points[seg.length-2];
        if (cursor.origin.sHandle) {
          prevPoint.setSHandle(cursor.origin.sHandle);
        } else {
          prevPoint.unsetHandle('sHandle');
        }
      }
    }

    edgesToUse = edgesToUse.filter((edge) => {
      return !edge.equal(cursor) && !edge.equal(cursor.twin);
    });

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
        logger.verbose('using only cursorOpts');
        cursor = cursorOpts[0];
      } else if (cursorOpts.length == 0) {
        // The current segment is closed and we need to pick an edge that's remaining
        // to continue in a new segment.
        logger.verbose('closing and moving on');
        pl.closeSegment();

        cursor = edgesToUse[0];
        pl.push(cursor.origin);
      } else {
        // TODO handle this case! I think we need to move clockwise.
        logger.verbose('opts not 1 with edges left', cursor);
        console.log(cursorOpts.join('\n'));
        debugger;
        break;
      }
    }
  }

  pl.closeSegment();

  return pl;
};

function doQueue(queue, op) {
  logger.verbose(queue, op);
  let result = queue[0];
  queue = queue.slice(1);

  while (queue.length > 0) {
    result = doBoolean(result, queue[0], op);
    queue = queue.slice(1);
  }

  return result;
}

function doElements(elements, op) {
  let queue = elements.map((elem) => { return elem.points });

  let resultPoints = doQueue(queue, op);

  if (elements.length === 0) {
    return null;
  }

  let result = new Path({
    d: resultPoints,
    stroke: elements[0].data.stroke,
    fill:   elements[0].data.fill
  });

  return result;
}

export default {
  unite(elems) { 
    return doElements(elems, 'unite');
  },
  intersect(elems) { 
    return doElements(elems, 'intersect');
  },
  subtract(elems) { 
    return doElements(elems, 'subtract');
  },
};
