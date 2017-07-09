import Path from 'geometry/path';

class Edge {
  constructor(origin, destination, prev, next) {
    this.origin = origin.toPosn();
    this.destination = destination.toPosn();
    this.prev = prev;
    this.next = next;
  }

  get twin() {
    return new Edge(this.destination, this.origin, this.next, this.prev);
  }
}

export function pathToEdges(path) {
  let points = path.points.all();  
  let edges = points.map((pt) => {
    return new Edge(pt.prec, pt);
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

  return edges;
}

export default function(a, b, op) {
}
