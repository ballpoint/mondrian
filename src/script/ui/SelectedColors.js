import consts from 'consts';
import Color from 'ui/color';

export default class SelectedColors {
  constructor(fill = new Color('#7eb9c9'), stroke = consts.black) {
    this.fill = fill;
    this.stroke = stroke;
  }
}
