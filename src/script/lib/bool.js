import Path from 'geometry/path';
import shapes from 'lab/shapes';

export class Edge {
  constructor(origin, destination, prev, next) {
    this.origin = origin.clone();
    this.destination = destination.clone();
    this.prev = prev;
    this.next = next;
  }

  get twin() {
    return new Edge(this.destination, this.origin, this.next, this.prev);
  }

  get lineSegment() {
    return this.destination.toLineSegment(this.origin);
  }

  intersections(other) {
    let lsa = this.lineSegment;
    let lsb = other.lineSegment;

    return shapes.intersections(lsa, lsb);
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

  static fromPath(path) {
    let points = path.points.all();  
    let edges = points.map((pt) => {
      return new Edge(pt, pt.succ);
    });
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
    }

    return new EdgeSet(edges);
  }

  replace(edge, replacements) {

  }

  intersect(es) {
    // O(n^2) for now fuck it.
    for (let edge of this.edges) {
      for (let other of es.edges) {
        let xns = edge.intersections(other);
        if (xns) {
          // We have intersections to deal with
          let replacementsSelf = [];
          let replacementsOther = [];

          for (let xn of xns) {
            console.log(xn);
          }
        }
      }
    }
  }
}

export default function(a, b, op) {
}
