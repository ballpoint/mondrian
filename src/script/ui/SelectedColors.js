import consts from 'consts';
import Color from 'ui/color';

export default class SelectedColors {
  constructor(fill = consts.fgGrey, stroke = consts.black) {
    this.fill = fill;
    this.stroke = stroke;
  }
}
