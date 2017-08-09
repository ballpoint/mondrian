import Color from 'ui/color';
import Bounds from 'geometry/bounds';
import Metadata from 'geometry/metadata';
import Range from 'geometry/range';
import Posn from 'geometry/posn';
import Thumb from 'ui/thumb';
import UUIDV4 from 'uuid/v4';

/*

    Mondrian SVG library

    Artur Sapek 2012 - 2017

*/

export default class Item {
  constructor(data = {}, metadata = {}) {
    this.data = data;

    this.points = [];
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

  /*
   * TODO move this into an external SVG serialization lib
  toSVG() {
    // Return the SVG DOM element that this Item object represents
    // We need to use the svg namespace for the element to behave properly
    let elem = document.createElementNS('http://www.w3.org/2000/svg', this.type);
    for (let key in this.data) {
      let val = this.data[key];
      if (key !== "") { elem.setAttribute(key, val); }
    }
    return elem;
  }

  toSVGString() {
    return new XMLSerializer().serializeToString(this.toSVG());
  }
  */

  validateColors() {
    // Convert color strings to Color objects
    if (this.data.fill != null && !(this.data.fill instanceof Color)) {
      this.data.fill = new Color(this.data.fill);
    }
    if (this.data.stroke != null && !(this.data.stroke instanceof Color)) {
      this.data.stroke = new Color(this.data.stroke);
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
    return (this.data['stroke-width'] = val);
  }

  finishToCanvas(context, projection) {
    if (this.data.fill) {
      context.fillStyle = this.data.fill.toRGBString();
      context.fill();
    }

    if (this.data.stroke) {
      context.strokeStyle = this.data.stroke.toRGBString();
      let lw = 1;
      if (this.data['stroke-width'] !== undefined) {
        lw = parseFloat(this.data['stroke-width']);
      }

      if (lw !== 0) {
        context.lineWidth = projection.z(lw);
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
