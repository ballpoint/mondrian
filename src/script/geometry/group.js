import Bounds from 'geometry/bounds';

export default class Group {
  constructor(children) {
    this.children = children;
  }

  bounds() {
    return new Bounds(this.children.map((item) => { return item.bounds() }));
  }

  drawToCanvas() {
    for (let elem of this.children) {
      elem.drawToCanvas(...arguments);
    }
  }

  lineSegments() {
    return this.children.reduce((a, b) => {
      return a.concat(b.lineSegments());
    }, []);
  }

  get childrenFlat() {
    let cf = [];
    for (let child of this.children) {
      if (child instanceof Group) {
        cf = cf.concat(child.childrenFlat);
      } else {
        cf.push(child);
      }
    }

    return cf;
  }

  child(i) {
    return this.children[i];
  }

  insert(child, i) {
    this.children = this.children.insertAt(child, i);
  }

  nudge()  { this.propagate('nudge', arguments); }

  scale()  { this.propagate('scale', arguments); }

  rotate() { this.propagate('rotate', arguments); }

  propagate(method, args) {
    for (let child of this.children) {
      child[method](...args);
    }
  }
}
