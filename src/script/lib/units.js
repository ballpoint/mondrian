import { PIXEL_RATIO } from 'lib/math';

let ppiCached;

const CM_TO_IN = 0.393701;

// Print unit conversions
const PT_TO_MM = 0.352778;
const PT_TO_CM = 0.0352778;
const PT_TO_IN = 1 / 72;
const PT_TO_PC = 1 / 12;

const units = {
  MM: 'mm',
  CM: 'cm',
  IN: 'in',
  PT: 'pt',
  PC: 'pc',

  ppi() {
    if (ppiCached === undefined) {
      // Calculate screen PPI
      let body = document.querySelector('body');
      let d = document.createElement('div');
      d.style.width = '1in';
      d.style.margin = '0';
      d.style.padding = '0';
      d.style.position = 'absolute';
      d.style.left = '-100px';
      d.style.top = '-100px';

      body.appendChild(d);
      ppiCached = d.offsetWidth * PIXEL_RATIO;
    }

    return ppiCached;
  },

  fromPt(n, unit) {
    switch (unit) {
      case this.MM:
        return n * PT_TO_MM;
      case this.CM:
        return n * PT_TO_CM;
      case this.IN:
        return n * PT_TO_IN;
      case this.PT:
        return n;
      case this.PC:
        return n * PT_TO_PC;
    }
  },

  toPt(n, unit) {
    switch (unit) {
      case this.MM:
        return n / PT_TO_MM;
      case this.CM:
        return n / PT_TO_CM;
      case this.IN:
        return n / PT_TO_IN;
      case this.PT:
        return n;
      case this.PC:
        return n / PT_TO_PC;
    }
  }
};

export default units;
