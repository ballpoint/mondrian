import Path from 'geometry/path';
import shapes from 'lab/shapes';

export class Edge {
  constructor(origin, destination, isTwin=false) {
    this.origin = origin.clone();
    this.destination = destination.clone();
    this.isTwin = isTwin;
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
    // Intersections now sorted
    for (let xn of xns.concat([this.destination])) {
      let edge = new Edge(origin, xn, this.isTwin);
      edge.prev = prev;
      prev.next = edge;
      edges.push(edge);
      prev = edge;
      origin = xn;
    }
    edges[edges.length-1].next = this.next;

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

    let twins = this.getTwins(edges);
    this.edges = this.edges.concat(twins);
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
    }
  }

  getTwins(edges) {
    let twins = edges.map((edge) => {
      let twin = new Edge(edge.destination, edge.origin);
      edge.twin = twin;
      twin.twin = edge;
      twin.isTwin = true;
      return twin;
    });

    twins.reverse();
    this.linkEdges(twins);

    return twins;
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

  getNonTwins() {
    return this.edges.filter((edge) => { return !edge.isTwin })
  }

  intersect(os) {
    let thisEdges = this.getNonTwins();
    let otherEdges = os.getNonTwins();
    // O(n^2) for now fuck it.
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
    console.log(this.length);
          // Fix this set
          this.replace(edge, edge.splitOn(xns));
          this.replace(edge.twin, edge.twin.splitOn(xns));

          // Fix the other set
          os.replace(other, other.splitOn(xns));
          os.replace(other.twin, other.twin.splitOn(xns));
    console.log(this.length);

        }
      }
    }
  }
}

export default function(a, b, op) {
}
