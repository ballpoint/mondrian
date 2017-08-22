import consts from 'consts';
import Color from 'ui/color';

export default class SelectedColors {
  constructor(fill = consts.blue, stroke = consts.black) {
    this.fill = fill;
    this.stroke = stroke;
  }
}
