import consts from 'consts';
import Color from 'ui/color';

export default class SelectedColors {
  constructor(fill = new Color('#7eb9c9'), stroke = consts.black) {
    this.fill = fill;
    this.fillMode = 'solid';
    this.stroke = stroke;
    this.strokeMode = 'solid';
  }

  get fill() {
    switch (this.fillMode) {
      case 'solid':
        return this._fill;
      case 'none':
        return Color.none();
    }
  }

  set fill(fill) {
    this._fill = fill;
  }

  set(which, color) {
    switch (which) {
      case 'fill':
        this.fill = color;
        return;
      case 'stroke':
        this.stroke = color;
        return;
    }
  }

  get(which) {
    switch (which) {
      case 'fill':
        return this.fill;
      case 'stroke':
        return this.stroke;
    }
  }

  equal(which, color) {
    let existing = this.get(which);
    return color.equal(existing);
  }

  setMode(which, mode) {
    switch (which) {
      case 'fill':
        this.fillMode = mode;
        return;
      case 'stroke':
        this.strokeMode = mode;
        return;
    }
  }

  get stroke() {
    switch (this.strokeMode) {
      case 'solid':
        return this._stroke;
      case 'none':
        return Color.none();
    }
  }

  set stroke(stroke) {
    this._stroke = stroke;
  }
}
