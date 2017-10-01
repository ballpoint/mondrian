import Color from 'ui/color';
import { NONE } from 'ui/color';

export default class DefaultColor {
  constructor(color) {
    this._color = color;
    this._mode = 'solid';
  }

  get color() {
    if (this._mode === 'solid') {
      return this._color;
    } else {
      return NONE;
    }
  }

  set color(color) {
    if (color === NONE) {
      this._mode = 'none';
    } else {
      this._color = color;
      this._mode = 'solid';
    }
  }

  set mode(mode) {
    this._mode = mode;
  }

  equal(other) {
    let color = this.color;
    if (color === NONE || other === NONE) {
      return color === other;
    } else {
      return this.color.equal(other);
    }
  }

  toString() {
    return this.color.toString();
  }
}
