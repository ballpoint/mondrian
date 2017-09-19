import consts from 'consts';
import Color from 'ui/color';
import { NONE } from 'ui/color';
import Bounds from 'geometry/bounds';
import Metadata from 'geometry/metadata';
import Range from 'geometry/range';
import Posn from 'geometry/posn';
import Thumb from 'ui/thumb';
import UUIDV4 from 'uuid/v4';

export default class Item {
  constructor(data = {}, metadata = {}) {
    this.data = data;

    //this.points = [];
    this.transform = {};
    this.boundsCached = null;

    if (data.id) {
      this.id = data.id;
    }

    this.metadata = new Metadata(metadata);

    this.validateColors();

    // Apply
    if (this.data['mondrian:angle'] != null) {
      this.metadata.angle = parseFloat(this.data['mondrian:angle'], 10);
    }

    // Internal ID only to be used for caching session-specific state
    // like thumbnails. Never persisted.
    this.__id__ = UUIDV4();
    this.__nonce__ = 1;
  }

  validateColors() {
    // Convert color strings to Color objects
    if (this.data.fill) {
      if (!(this.data.fill instanceof Color)) {
        this.data.fill = Color.fromString(this.data.fill);
      }
    } else {
      this.data.fill = consts.black;
    }

    if (this.data.stroke) {
      if (!(this.data.stroke instanceof Color)) {
        this.data.stroke = Color.fromString(this.data.stroke);
      }
    } else {
      this.data.stroke = NONE;
    }

    if (this.data['stroke-width'] == null) {
      return (this.data['stroke-width'] = 1);
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

    let cloneTransform = _.clone(this.transform);
    delete cloneData.id;
    let clone = new this.constructor(cloneData);
    clone.transform = cloneTransform;
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
      return (this.boundsCached = new Bounds(
        xrs.min,
        yrs.min,
        xrs.length(),
        yrs.length()
      ));
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

  finishToCanvas(context, projection) {
    let fill = 'black';
    if (this.data.fill) {
      fill = this.data.fill.toString();
    }
    if (fill && fill !== 'none') {
      context.fillStyle = fill;
      context.fill();
    }

    let stroke = this.data.stroke;
    if (stroke && stroke !== 'none') {
      context.strokeStyle = this.data.stroke.toString();
      let lineWidth = 1;
      let lineCap = 'butt'; // lol
      let lineJoin = 'miter';
      if (this.data['stroke-width'] !== undefined) {
        lineWidth = parseFloat(this.data['stroke-width']);
      }
      if (this.data['stroke-linecap'] !== undefined) {
        lineCap = this.data['stroke-linecap'];
      }
      if (this.data['stroke-linejoin'] !== undefined) {
        lineJoin = this.data['stroke-linejoin'];
      }

      if (lineWidth !== 0) {
        context.lineWidth = projection.z(lineWidth);
        context.lineCap = lineCap;
        context.lineJoin = lineJoin;
        context.stroke();
      }
    }

    if (!this.data.fill && !this.data.stroke) {
      // Default behavior for elements with neither a fill nor stroke set is to just
      // fill them with black.
      context.fillStyle = '#000000';
      context.fill();
    }
  }

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

function __guard__(value, transform) {
  return typeof value !== 'undefined' && value !== null
    ? transform(value)
    : undefined;
}
