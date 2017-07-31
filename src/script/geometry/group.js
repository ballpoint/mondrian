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

  get __nonce__() {
    return this.children.map((child) => {
      return child.__nonce__;
    }).reduce((a, b) => { return a + b }, 0);
  }

  child(i) {
    return this.children[i];
  }

  get empty() {
    return this.children.length === 0;
  }

  insert(child, i) {
    this.children = this.children.insertAt(child, i);
  }

  remove(child) {
    this.children = this.children.filter((existing) => { return existing !== child });
  }

  nudge()  { this.propagate('nudge', arguments); }

  scale()  { this.propagate('scale', arguments); }

  rotate() { this.propagate('rotate', arguments); }

  matrix() { this.propagate('matrix', arguments); }

  setFill() { this.propagate('setFill', arguments); }

  setStroke() { this.propagate('setStroke', arguments); }

  setStrokeWidth() { this.propagate('setStrokeWidth', arguments); }

  propagate(method, args) {
    for (let child of this.children) {
      child[method](...args);
    }
  }
}
