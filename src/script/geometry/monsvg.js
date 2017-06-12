import _ from 'lodash';
import Color from 'ui/color';
import Bounds from 'geometry/bounds';
import Range from 'geometry/range';
/*

    Mondrian SVG library

    Artur Sapek 2012 - 2017

*/

export default class Monsvg {
  static initClass() {
    this.prototype.points = [];
    this.prototype.transform = {};
    this.prototype.boundsCached = null;
  }

  // MonSvg
  //
  // Over-arching class for all vector objects
  //
  // I/P : data Object of SVG element's attributes
  //
  // O/P : self
  //
  // Subclasses:
  //   Line
  //   Rect
  //   Circle
  //   Polygon
  //   Path


  constructor(data={}) {
    // Create SVG element representation

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

  updateDataArchived(attr) {
    return;
  }

  toSVG() {
    // Return the SVG DOM element that this Monsvg object represents
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
    // Returns the center of a cluster of posns
    //
    // O/P: Posn

    let xr = this.xRange();
    let yr = this.yRange();
    return new Posn(xr.min + ((xr.max - xr.min) / 2), yr.min + ((yr.max - yr.min) / 2));
  }

  topLeftBound() {
    return new Posn(this.xRange().min, this.yRange().min);
  }

  topRightBound() {
    return new Posn(this.xRange().max, this.yRange().min);
  }

  bottomRightBound() {
    return new Posn(this.xRange().max, this.yRange().max);
  }

  bottomLeftBound() {
    return new Posn(this.xRange().min, this.yRange().max);
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

  zIndex() {
    return 0;
  }

  swapFillAndStroke() {
    let swap = this.data.stroke;
    this.attr({
      'stroke': this.data.fill,
      'fill': swap
    });
  }


  eyedropper(sample) {
    this.data.fill = sample.data.fill;
    this.data.stroke = sample.data.stroke;
    this.data['stroke-width'] = sample.data['stroke-width'];
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

  xRange() {
    return this.bounds().xr;
  }

  yRange() {
    return this.bounds().yr;
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
    if (this.points != null ? this.points.closed : undefined) { context.closePath(); }

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


Monsvg.initClass();



function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
