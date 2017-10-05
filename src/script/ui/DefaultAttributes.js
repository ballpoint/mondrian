import Color from 'ui/color';
import DefaultColor from 'ui/DefaultColor';

import Path from 'geometry/path';
import Text from 'geometry/text';

export default class DefaultAttributes {
  constructor() {
    // set defaults
    let defaults = DefaultAttributes.defaults;
    for (let key in defaults) {
      this[key] = defaults[key];
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
      fill: new DefaultColor(new Color('#7eb9c9')),
      stroke: new DefaultColor(new Color('#000000'))
    };
  }

  get(key) {
    switch (key) {
      case 'fill':
      case 'stroke':
        return this[key].color;
      default:
        return this[key];
    }
  }

  set(key, val) {
    switch (key) {
      case 'fill':
      case 'stroke':
        return (this[key].color = val);
      default:
        return (this[key] = val);
    }
  }

  forType(type, toAdd = {}) {
    let keys = [
      'stroke',
      'fill',
      'stroke-width',
      'stroke-linecap',
      'stroke-linejoin'
    ];

    switch (type) {
      case Path:
        // keys stay as-is
        break;
      case Text:
        keys = keys.concat(['font-family', 'font-size', 'line-height']);
        // Make new Text have no stroke by default
        keys = keys.filter(k => {
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
