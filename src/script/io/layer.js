import Bounds from 'geometry/bounds';
import Group from 'geometry/group';

export default class Layer {
  constructor(attrs) {
    this.id = attrs.id;
    this.children = attrs.children;
  }

  remove(elem) {
    this.children = this.children.filter((existing) => { return existing !== elem });
  }

  bounds() {
    return new Bounds(this.children.map((item) => { return item.bounds() }));
  }

  drawToCanvas() {
    for (let elem of this.children) {
      elem.drawToCanvas(...arguments);
    }
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

  insert(child, i) {
    this.children = this.children.insertAt(child, i);
  }

  push(child) {
    this.children.push(child);
  }

  get empty() {
    return this.children.length === 0;
  }

  nextChildIndex() {
    return this.index.concat([this.children.length]);
  }
}
