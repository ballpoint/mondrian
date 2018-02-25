import Color from 'ui/color';

import Path from 'geometry/path';
import Text from 'geometry/text';

export default class DefaultAttributes {
  constructor(attrs = {}) {
    // set defaults
    let defaults = DefaultAttributes.defaults;
    for (let key in defaults) {
      if (attrs[key] === undefined) attrs[key] = defaults[key];
    }
    for (let key in attrs) {
      this[key] = attrs[key];
    }
  }

  static get defaults() {
    return {
      'font-size': 12,
      'font-family': 'Arial',
      'line-height': 1.5,
      'stroke-width': 1,
      'stroke-linecap': 'butt',
      'stroke-linejoin': 'miter',
      fill: new Color('#7eb9c9'),
      stroke: new Color('#000000')
    };
  }

  get(key) {
    let val = this[key];
    if (val instanceof Color) {
      // Make a copy of the color object
      return val.clone();
    } else {
      return val;
    }
  }

  set(key, val) {
    return (this[key] = val);
  }

  forType(type, toAdd = {}) {
    let keys = ['stroke', 'fill', 'stroke-width', 'stroke-linecap', 'stroke-linejoin'];

    switch (type) {
      case Path:
        // keys stay as-is
        break;
      case Text:
        keys = keys.concat(['font-family', 'font-size', 'line-height', 'align', 'valign']);
        // Make new Text have no stroke by default
        keys = keys.filter((k) => {
          return k !== 'stroke';
        });
        break;
    }

    let attrs = {};
    for (let key of keys) {
      attrs[key] = this.get(key);
    }

    for (let key in toAdd) {
      attrs[key] = toAdd[key];
    }

    return attrs;
  }
}
