import Path from 'geometry/path';
import PathPoint from 'geometry/path-point';
import shapes from 'lab/shapes';
import LineSegment from 'geometry/line-segment';
import CubicBezier from 'geometry/cubic-bezier-line-segment';

export class Edge {
  constructor(origin, destination, twin) {
    this.origin = origin.clone();
    this.destination = destination.clone();

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
    let lastEdge = edges[edges.length-1];
    let edge = new Edge(lastEdge.destination, finalDestination);
    edges[edges.length-1].next = edge;
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
    this.linkEdges(edges);
  }

  get length() {
    return this.edges.length;
  }

  get(i) {
    return this.edges[i];
  }

  linkEdges(edges) {
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

  static fromPath(path) {
    let points = path.points.all();  
    let edges = points.map((pt) => {
      // Going in default dir
      return new Edge(pt, pt.succ);
    });

    return new EdgeSet(edges);
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

    for (let edge of thisEdges) {
      for (let other of otherEdges) {
        let xns = edge.intersections(other);
        if (xns) {
          // We have intersections to deal with
          let replacementsSelf = [];
          let replacementsOther = [];

          console.log(edge.toString())
          console.log(other.toString());
          console.log(xns.join(' '));

          // Fix this set
          this.replace(edge, edge.splitOn(xns));

          // Fix the other set
          os.replace(other, other.splitOn(xns));
        }
      }
    }
  }
}

export default function(a, b, op) {
}
