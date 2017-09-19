import consts from 'consts';
import Color from 'ui/color';
import { NONE } from 'ui/color';

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
        return NONE;
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
        return NONE;
    }
  }

  set stroke(stroke) {
    this._stroke = stroke;
  }
}
