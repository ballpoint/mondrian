import Bounds from "geometry/bounds";
import Metadata from "geometry/metadata";
import Group from "geometry/group";
import UUIDV4 from "uuid/v4";

export default class Layer {
  constructor(attrs, metadata = {}) {
    this.id = attrs.id;
    this.children = attrs.children;
    this.metadata = new Metadata(metadata);
    this.__id__ = UUIDV4();
  }

  remove(elem) {
    this.children = this.children.filter(existing => {
      return existing !== elem;
    });
  }

  bounds() {
    return new Bounds(
      this.children.map(item => {
        return item.bounds();
      })
    );
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
    return this.children
      .map(child => {
        return child.__nonce__;
      })
      .reduce((a, b) => {
        return a + b;
      }, 0);
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

  drawToCanvas(layer, context, projection) {
    if (this.metadata.visible === false) return;

    for (let child of this.children) {
      child.drawToCanvas(layer, context, projection);
    }
  }
}
