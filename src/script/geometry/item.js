import Color from 'ui/color';
import Bounds from 'geometry/bounds';
import Range from 'geometry/range';
import Posn from 'geometry/posn';

/*

    Mondrian SVG library

    Artur Sapek 2012 - 2017

*/

export default class Item {
  static initClass() {
    this.prototype.points = [];
    this.prototype.transform = {};
    this.prototype.boundsCached = null;
  }

  constructor(data={}) {
    this.data = data;

    if (data.id) {
      this.id = data.id;
    }

    this.metadata = {
      angle: 0,
      locked: false
    };

    this.validateColors();

    // Apply
    if (this.data["mondrian:angle"] != null) {
      this.metadata.angle = parseFloat(this.data["mondrian:angle"], 10);
    }
  }

  set parent(parent) {
    this.parent = parent;
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
    if ((this.data.fill != null) && !(this.data.fill instanceof Color)) {
      this.data.fill = new Color(this.data.fill);
    }
    if ((this.data.stroke != null) && !(this.data.stroke instanceof Color)) {
      this.data.stroke = new Color(this.data.stroke);
    }
    if ((this.data["stroke-width"] == null)) {
      return this.data["stroke-width"] = 1;
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
          result.push(this.data[key] = val(this.data[key]));
        } else {
          result.push(this.data[key] = val);
        }
      }
      return result;
    })();
  }

  clone() {
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
      'stroke': this.data.fill,
      'fill': swap
    });
  }

  bounds() {
    let cached = this.boundsCached;
    if ((cached !== null) && this.caching) {
      return cached;
    } else {
      let { xrs, yrs } = this.getRanges();
      return this.boundsCached = new Bounds(
        xrs.min,
        yrs.min,
        xrs.length(),
        yrs.length());
    }
  }

  carryOutTransformations(transform, center) {
    let key, val;
    if (transform == null) { ({ transform } = this.data); }
    if (center == null) { center = new Posn(0, 0); }
    /*
      We do things this way because fuck the transform attribute.

      Basically, when we commit shapes for the first time from some other file,
      if they have a transform attribute we effectively just alter the data
      that makes those shapes up so that they still look the same, but they no longer
      have a transform attr.
    */

    let attrs = transform.replace(", ", ",").split(" ").reverse();

    return Array.from(attrs).map((attr) =>
      ((key = __guard__(attr.match(/[a-z]+/gi), x1 => x1[0])),
      (val = __guard__(attr.match(/\([\-\d\,\.]*\)/gi), x2 => x2[0].replace(/[\(\)]/gi, ""))),

      (() => { switch (key) {
        case "scale":
          // A scale is a scale, but we also scale the stroke-width
          let factor = parseFloat(val);
          this.scale(factor, factor, center);
          return this.data["stroke-width"] *= factor;

        case "translate":
          // A translate is simply a nudge
          val = val.split(",");
          let x = parseFloat(val[0]);
          let y = (val[1] != null) ? parseFloat(val[1]) : 0;
          return this.nudge(x, -y);

        case "rotate":
          // Duh
          this.rotate(parseFloat(val), center);
          return this.metadata.angle = 0;
      } })()));
  }

  setFill(val) {
    return this.data.fill = new Color(val);
  }

  setStroke(val) {
    return this.data.stroke = new Color(val);
  }

  setStrokeWidth(val) {
    return this.data['stroke-width'] = val;
  }

  finishToCanvas(context, projection) {
    if (this.data.fill) {
      context.fillStyle = this.data.fill.toRGBString();
      context.fill();
    }

    if (this.data.stroke) {
      context.strokeStyle = this.data.stroke.toRGBString();
      let lw = parseFloat(this.data['stroke-width']);
      if (lw === undefined) lw = 1;

      context.lineWidth = projection.z(lw);

      context.stroke();
    }
  }

  clearCachedObjects() {}

  lineSegments() {}
}


Item.initClass();



function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}