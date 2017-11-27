import Color from 'ui/color';

export default class DefaultColor {
  constructor(color) {
    this._color = color;
    this._mode = 'solid';
  }

  get color() {
    if (this._mode === 'solid') {
      return this._color;
    } else {
      return Color.none();
    }
  }

  set color(color) {
    if (color.isNone) {
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
    return this.color.equal(other);
  }

  toString() {
    return this.color.toString();
  }
}
