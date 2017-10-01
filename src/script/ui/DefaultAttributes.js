import Color from 'ui/color';
import DefaultColor from 'ui/DefaultColor';

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
      'stroke-width': 1,
      'stroke-linecap': 'butt',
      'stroke-linejoin': 'miter',
      fill: new DefaultColor(new Color('#7eb9c9')),
      stroke: new DefaultColor(new Color('#000000'))
    };
  }
}
