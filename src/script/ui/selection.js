import Bounds from 'geometry/bounds';
import Posn from 'geometry/posn';
import PathPoint from 'geometry/path-point';
import Group from 'geometry/group';

// Selection types
export const ELEMENTS = 'elements';
export const POINTS = 'points';
export const PHANDLE = 'pHandle';
export const SHANDLE = 'sHandle';

export default class Selection {
  constructor(doc, items = [], type = null) {
    this.doc = doc;
    this.items = items;

    if (this.empty) return 'NONE';

    if (type === null) {
      let sample = this.items[0];
      if (sample instanceof PathPoint) {
        this.type = POINTS;
      } else {
        this.type = ELEMENTS;
      }
    } else {
      this.type = type;
    }
  }

  [Symbol.iterator]() {
    return this.items;
  }

  map(func) {
    return this.items.map(func);
  }

  filter(func) {
    return this.items.filter(func);
  }

  has(item) {
    return this.items.has(item);
  }

  clone() {
    return new Selection(this.doc, this.items.slice(0));
  }

  push(item) {
    this.items.push(item);
  }

  remove(item) {
    this.items = this.items.removeIndex(this.items.indexOf(item));
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
    return this.type === other.type && this.items.sameMembers(other.items);
  }

  get empty() {
    return this.items.length === 0;
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

  isOfType(types) {
    return types.indexOf(this.type) > -1;
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

    if (this.type === ELEMENTS) {
      let angleFreq = {};

      let selectedAngles = _.uniq(
        this.items.map(e => {
          if (angleFreq[e.metadata.angle] === undefined) {
            angleFreq[e.metadata.angle] = 0;
          }
          angleFreq[e.metadata.angle]++;

          return e.metadata.angle;
        })
      );
      if (selectedAngles.length === 1) {
        angle = selectedAngles[0];
      } else if (selectedAngles.length > 1) {
        let maxLocal = 0;
        for (let key in angleFreq) {
          let freq = angleFreq[key];
          if (freq > maxLocal) {
            angle = parseFloat(key);
            maxLocal = freq;
          }
        }
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
    } else if (this.type === POINTS) {
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
    } else if (this.type === SHANDLE || this.type === PHANDLE) {
      let handle;
      let pt = this.items[0];
      if (this.type === SHANDLE) {
        handle = pt.sHandle;
      } else {
        handle = pt.pHandle;
      }

      bounds = new Bounds(handle.x, handle.y, 0, 0);
      center = new Posn(handle.x, handle.y);
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
    let vals = [];
    let selection = this.ofType(type);
    for (let item of selection) {
      let val = item.data[key];
      if (val !== undefined) {
        vals.push(val);
      }
    }

    return _.uniqWith(vals, (a, b) => {
      if (a.valueOf !== undefined) a = a.valueOf();
      if (b.valueOf !== undefined) b = b.valueOf();
      return a == b;
    });

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

  withAttrValue(key, val) {
    let items = this.items.filter(item => {
      if (!item.data) {
        debugger;
      }

      let iv = item.data[key];
      if (val.valueOf && iv.valueOf) {
        return val.valueOf() == iv.valueOf();
      } else {
        return val == iv;
      }
    });

    return new Selection(this.doc, items);
  }

  get indexes() {
    return this.items
      .map(item => {
        return item.index;
      })
      .filter(index => {
        if (index === null) {
          console.warn('null index in history!');
          return false;
        } else {
          return true;
        }
      })
      .sort((a, b) => {
        return a.compare(b);
      });
  }

  get fingerprint() {
    return this.indexes
      .map(idx => {
        return idx.toString();
      })
      .join(',');
  }
}
