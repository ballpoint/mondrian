import Bounds from 'geometry/bounds';
import Metadata from 'geometry/metadata';
import UUIDV4 from 'uuid/v4';

export default class Group {
  constructor(children, metadata = {}) {
    this.children = children;

    this.metadata = new Metadata(metadata);
    this.__id__ = UUIDV4();
  }

  get type() {
    return 'group';
  }

  bounds() {
    let nonce = this.__nonce__;
    if (nonce === this._cachedBoundsNonce) {
      return this._cachedBounds;
    }

    let bounds = new Bounds(
      this.children.map(item => {
        return item.bounds();
      })
    );
    this._cachedBoundsNonce = nonce;
    this._cachedBounds = bounds;
    return bounds;
  }

  drawToCanvas() {
    if (this.metadata.visible === false) return;

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

  get empty() {
    return this.children.length === 0;
  }

  insert(child, i) {
    this.children = this.children.insertAt(child, i);
  }

  remove(child) {
    this.children = this.children.filter(existing => {
      return existing !== child;
    });
  }

  nudge() {
    this.propagate('nudge', arguments);
  }

  scale() {
    this.propagate('scale', arguments);
  }

  rotate(a) {
    this.propagate('rotate', arguments);

    this.metadata.angle += a;
  }

  matrix() {
    this.propagate('matrix', arguments);
  }

  setFill() {
    this.propagate('setFill', arguments);
  }

  setStroke() {
    this.propagate('setStroke', arguments);
  }

  setStrokeWidth() {
    this.propagate('setStrokeWidth', arguments);
  }

  propagate(method, args) {
    for (let child of this.children) {
      child[method](...args);
    }
  }

  clone() {
    return new Group(
      this.children.map(child => {
        return child.clone();
      }),
      this.metadata
    );
  }
}
