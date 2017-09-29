import Bounds from 'geometry/bounds';
import Posn from 'geometry/posn';
import PathPoint from 'geometry/path-point';
import Group from 'geometry/group';

export default class Selection {
  constructor(doc, items = []) {
    this.doc = doc;
    this.items = items;
  }

  [Symbol.iterator]() {
    return this.items;
  }

  map(func) {
    return this.items.map(func);
  }

  has(item) {
    return this.items.has(item);
  }

  clone() {
    return new Selection(this.doc, this.items);
  }

  push(item) {
    this.items.push(item);
  }

  remove(item) {
    this.items.removeIndex(this.items.indexOf(item));
  }

  clearCache() {
    delete this._bounds;
    delete this._angle;
    delete this._center;
    this.cleanUp();
  }

  get bounds() {
    if (this._bounds === undefined) {
      this.calculateBounds();
    }

    return this._bounds;
  }

  get angle() {
    if (this._angle === undefined) {
      this.calculateBounds();
    }

    return this._angle;
  }

  get center() {
    if (this._center === undefined) {
      this.calculateBounds();
    }

    return this._center;
  }

  get length() {
    return this.items.length;
  }

  equal(other) {
    return this.items.sameMembers(other.items);
  }

  get empty() {
    return this.items.length === 0;
  }

  get type() {
    if (this.empty) return 'NONE';

    let sample = this.items[0];
    if (sample instanceof PathPoint) {
      return 'POINTS';
    } else {
      return 'ELEMENTS';
    }
  }

  get flat() {
    let selection = [];
    for (let item of this.items) {
      if (item instanceof Group) {
        selection = selection.concat(item.childrenFlat);
      } else {
        selection.push(item);
      }
    }

    return selection;
  }

  ofType(type) {
    if (type === undefined) {
      return this.flat;
    }
    return this.flat.filter(item => {
      return item instanceof type;
    });
  }

  contains(item) {
    return this.items.indexOf(item) > -1;
  }

  cleanUp() {
    // Filter out deleted items
    this.items = this.items.filter(item => {
      return this.doc.getFromIndex(item.index) === item;
    });
  }

  calculateBounds() {
    this.cleanUp();

    if (this.empty) return;

    let bounds;
    let angle = 0;
    let center;

    if (this.type === 'ELEMENTS') {
      let selectedAngles = _.uniq(
        this.items.map(e => {
          return e.metadata.angle;
        })
      );
      if (selectedAngles.length === 1) {
        angle = selectedAngles[0];
      }

      let boundsList = [];

      for (let elem of this.items) {
        if (angle !== 0) {
          elem.rotate(-angle, new Posn(0, 0));
        }
        boundsList.push(elem.bounds());
        if (angle !== 0) {
          elem.rotate(angle, new Posn(0, 0));
        }
      }

      bounds = Bounds.fromBounds(boundsList);
      center = bounds.center();
    } else if (this.type === 'POINTS') {
      let selectedAngles = _.uniq(
        this.items.map(e => {
          return e.path.metadata.angle;
        })
      );
      if (selectedAngles.length === 1) {
        angle = selectedAngles[0];
      }

      if (angle !== 0) {
        for (let item of this.items) {
          item.rotate(-angle, new Posn(0, 0));
        }
      }
      bounds = Bounds.fromPosns(this.items);
      if (angle !== 0) {
        for (let item of this.items) {
          item.rotate(angle, new Posn(0, 0));
        }
      }

      center = bounds.center();
    }

    if (angle) {
      center = center.rotate(angle, new Posn(0, 0));
      bounds.centerOn(center);
      bounds.angle = angle;
    }

    this._bounds = bounds;
    this._angle = angle;
    this._center = center;
  }

  getAttrValues(type, key) {
    let vals = new Set();
    let selection = this.ofType(type);
    for (let item of selection) {
      let val = item.data[key];
      if (val !== undefined) {
        vals.add(val);
      }
    }

    return Array.from(vals.values());
  }

  getAttr(type, key) {
    let values = this.getAttrValues(type, key);
    if (values.length === 1) {
      return values[0];
    } else {
      return null;
    }
  }
}
