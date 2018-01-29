import consts from 'consts';
import Color from 'ui/color';
import Posn from 'geometry/posn';
import Bounds from 'geometry/bounds';
import Range from 'geometry/range';

import Metadata from 'geometry/metadata';

export default class Item {
  constructor(data = {}, metadata = {}) {
    this.data = data;

    this.boundsCached = null;

    if (data.id) {
      this.id = data.id;
    }

    this.metadata = new Metadata(metadata);

    this.validateColors();

    this.setDefaultAttrs();

    // Internal nonce only to be used for caching session-specific state
    // like thumbnails. Never persisted.
    this.__nonce__ = 1;
  }

  static get type() {
    return 'item';
  }

  validateColors() {
    // Convert color strings to Color objects
    if (this.data.fill) {
      if (!(this.data.fill instanceof Color)) {
        this.data.fill = Color.fromString(this.data.fill);
      }
    } else {
      if (!this.data.stroke) {
        this.data.fill = consts.black;
      }
    }

    if (this.data.stroke) {
      if (!(this.data.stroke instanceof Color)) {
        this.data.stroke = Color.fromString(this.data.stroke);
      }
    } else {
      this.data.stroke = Color.none();
    }
  }

  setDefaultAttrs() {
    const defaults = {
      'stroke-width': 1,
      'stroke-linecap': 'butt',
      'stroke-linejoin': 'miter'
    };

    for (let k in defaults) {
      if (this.data[k] === undefined) {
        this.data[k] = defaults[k];
      }
    }
  }

  center() {
    return this.bounds().center();
  }

  attr(data) {
    return (() => {
      let result = [];
      for (let key in data) {
        let val = data[key];
        if (typeof val === 'function') {
          result.push((this.data[key] = val(this.data[key])));
        } else {
          result.push((this.data[key] = val));
        }
      }
      return result;
    })();
  }

  clone() {
    this.commitData();
    let cloneData = _.clone(this.data);
    let clone = new this.constructor(cloneData);
    return clone;
  }

  swapFillAndStroke() {
    let swap = this.data.stroke;
    this.attr({
      stroke: this.data.fill,
      fill: swap
    });
  }

  bounds() {
    let cached = this.boundsCached;
    if (cached !== null && this.caching) {
      return cached;
    } else {
      let { xrs, yrs } = this.getRanges();
      if (xrs.isFinite && yrs.isFinite) {
        return (this.boundsCached = new Bounds(
          xrs.min,
          yrs.min,
          xrs.length(),
          yrs.length()
        ));
      } else {
        return new Bounds(0, 0, 0, 0);
      }
    }
  }

  setFill(val) {
    return (this.data.fill = new Color(val));
  }

  setStroke(val) {
    return (this.data.stroke = new Color(val));
  }

  setStrokeWidth(val) {
    this.data['stroke-width'] = val;
  }

  setStrokeLineCap(val) {
    this.data['stroke-linecap'] = val;
  }

  setStrokeLineJoin(val) {
    this.data['stroke-linejoin'] = val;
  }

  finishToCanvas(context, projection, fillAction, strokeAction) {}

  nudgeCachedObjects(x, y) {
    if (this.boundsCached != null) {
      this.boundsCached.nudge(x, y);
      this.__nonce__++;
    }
  }

  scaleCachedObjects(x, y, origin) {
    if (this.boundsCached != null) {
      this.boundsCached.scale(x, y, origin);
      this.boundsCached.unflip();
      this.__nonce__++;
    }
  }

  clearCachedObjects() {
    this.boundsCached = null;
    this.__nonce__++;
    return this;
  }

  lineSegments() {}
}
