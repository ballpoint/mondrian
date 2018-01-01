import { PIXEL_RATIO } from 'lib/math';

let ppiCached;

const CM_TO_IN = 0.393701;

const units = {
  PX: 'px',
  MM: 'mm',
  CM: 'cm',
  IN: 'in',

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
      console.log(d.offsetWidth);
      ppiCached = d.offsetWidth * PIXEL_RATIO;
    }

    return ppiCached;
  },

  pxScaleFactor(unit) {
    switch (unit) {
      case this.PX:
        return 1;
      case this.IN:
        return this.ppi();
      case this.CM:
        return CM_TO_IN * this.ppi();
    }
  },

  convert(n, from, to) {
    if (from === this.MM) {
      n /= 100.0;
      from = this.CM;
    }

    if (from === to) {
      return n;
    }

    if (from === this.CM && to === this.IN) {
      return n * CM_TO_IN;
    } else if (from === this.IN && to === this.CM) {
      return n / CM_TO_IN;
    } else if (from === this.IN && to === this.PX) {
      return n * this.ppi();
    } else if (from === this.CM && to === this.PX) {
      return this.convert(n, this.CM, this.IN) * this.ppi();
    } else if (from === this.PX && to === this.IN) {
      return n / this.ppi();
    } else if (from === this.PX && to === this.CM) {
      return this.convert(n * this.ppi(), this.IN, this.CM);
    }
  }
};

export default units;
