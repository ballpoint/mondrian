// Color class
// I really need to rewrite this or clean it up
// It's still mostly auto-converted coffeescript that I wrote 6 years ago

export default class Color {
  constructor(r, g, b, a = 1.0) {
    // Clone existing color
    if (r instanceof Color) {
      this.r = r.r;
      this.g = r.g;
      this.b = r.b;
      this.a = r.a;
      this.hex = r.hex;
      return this;
    }

    // Handle none
    if (r === null || r === 'none') {
      // None value
      this.r = 0;
      this.g = 0;
      this.b = 0;
      this.a = 0;
      this.isNone = true;
      return this;
    }

    if (typeof r === 'string') {
      return Color.fromString(r);
    } else {
      // Numbers
      this.r = r;
      this.g = g;
      this.b = b;
      this.a = a;

      if (r === 0 && g === 0 && b === 0 && a === 0) {
        this.isNone = true;
      }

      if (isNaN(g)) debugger;

      if (this.g == null && this.b == null) {
        this.g = this.r;
        this.b = this.r;
      }
      this.hex = this.rgbToHex(this.r, this.g, this.b);
    }

    if (isNaN(this.r || isNaN(this.g || isNaN(this.b)))) {
      if (isNaN(this.r)) {
        this.r = 0;
      }
      if (isNaN(this.g)) {
        this.g = 0;
      }
      if (isNaN(this.b)) {
        this.b = 0;
      }
      this.updateHex();
    }

    this.r = Math.min(this.r, 255);
    this.g = Math.min(this.g, 255);
    this.b = Math.min(this.b, 255);

    this.r = Math.max(this.r, 0);
    this.g = Math.max(this.g, 0);
    this.b = Math.max(this.b, 0);
  }

  static none() {
    return new Color(null);
  }

  static fromHSL(h, s, l) {
    let r, g, b;

    h /= 360;
    s /= 100;
    l /= 100;

    function hue2rgb(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return new Color(r * 255, g * 255, b * 255);
  }

  static fromString(str) {
    if (str === 'none') {
      return this.none();
    } else if (str.charAt(0) === '#' || str.length === 6) {
      return Color.fromHex(str);
    } else if (str.match(/rgba?\(.*\)/gi) != null) {
      return Color.fromRGBString(str);
    } else {
      console.error('cannot parse color ' + str);
      return this.none();
    }
  }

  static fromHex(hex) {
    hex = hex.toUpperCase().replace('#', '');

    let r = this.hexToVal(hex.substring(0, 2));
    let g = this.hexToVal(hex.substring(2, 4));
    let b = this.hexToVal(hex.substring(4, 6));

    return new Color(r, g, b);
  }

  static fromRGBString(str) {
    let vals = str.match(/[\d\.]+/gi).map(v => {
      return parseInt(v, 10);
    });
    let r = vals[0];
    let g = vals[1];
    let b = vals[2];
    let a = 1;

    if (vals[3] != null) {
      a = parseFloat(vals[3]);
    }
    return new Color(r, g, b, a);
  }

  clone() {
    return new Color(this.r, this.g, this.b);
  }

  min() {
    return [this.r, this.g, this.b].sort((a, b) => a - b)[0];
  }

  mid() {
    return [this.r, this.g, this.b].sort((a, b) => a - b)[1];
  }

  max() {
    return [this.r, this.g, this.b].sort((a, b) => a - b)[2];
  }

  midpoint() {
    return this.max() / 2;
  }

  valToHex(val) {
    let chars = '0123456789ABCDEF';
    return chars.charAt((val - val % 16) / 16) + chars.charAt(val % 16);
  }

  static hexToVal(hex) {
    let chars = '0123456789ABCDEF';
    return chars.indexOf(hex.charAt(0)) * 16 + chars.indexOf(hex.charAt(1));
  }

  rgbToHex(r, g, b) {
    return `${this.valToHex(r)}${this.valToHex(g)}${this.valToHex(b)}`;
  }

  recalculateHex() {
    return (this.hex = this.rgbToHex(this.r, this.g, this.b));
  }

  valueOf() {
    return this.hex;
  }

  darken(amt) {
    return new Color(
      Math.round(this.r * (1.0 - amt)),
      Math.round(this.g * (1.0 - amt)),
      Math.round(this.b * (1.0 - amt))
    );
  }

  hue() {
    // returns float 0.0 - 1.0

    let r = this.r / 255;
    let g = this.g / 255;
    let b = this.b / 255;
    let max = Math.max(r, g, b);
    let min = Math.min(r, g, b);

    if (max === min) {
      // grey
      return 0;
    }

    let h;

    let d = max - min;

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = 2.0 + (b - r) / d;
        break;
      case b:
        h = 4.0 + (r - g) / d;
        break;
    }

    h /= 6;

    return h;
  }

  lightness() {
    // returns float 0.0 - 1.0
    return (this.min() + this.max()) / 2 / 255;
  }

  saturation() {
    let max = this.max();
    let min = this.min();
    let d = max - min;

    let sat = this.lightness() >= 0.5 ? d / (510 - max - min) : d / (max + min);
    if (isNaN(sat)) {
      sat = 1.0;
    }
    return sat;
  }

  desaturate(amt) {
    if (amt == null) {
      amt = 1.0;
    }
    let mpt = this.midpoint();

    return new Color(
      this.r - (this.r - mpt) * amt,
      this.g - (this.g - mpt) * amt,
      this.b - (this.b - mpt) * amt
    );
  }

  lighten(amt) {
    if (amt == null) {
      amt = 0.5;
    }
    amt *= 255;
    this.r = Math.min(255, this.r + amt);
    this.g = Math.min(255, this.g + amt);
    this.b = Math.min(255, this.b + amt);
    this.hex = this.rgbToHex(this.r, this.g, this.b);
    return this;
  }

  mix(color, percentage) {
    let rdiff = color.r - this.r;
    let gdiff = color.g - this.g;
    let bdiff = color.b - this.b;

    return new Color(
      this.r + Math.round(percentage * rdiff),
      this.g + Math.round(percentage * gdiff),
      this.b + Math.round(percentage * bdiff)
    );
  }

  toRGBString() {
    if (this.isNone) return 'none';

    return `rgba(${this.r}, ${this.g}, ${this.b}, ${
      this.a === undefined ? 1 : this.a
    })`;
  }

  toHexString() {
    if (this.isNone) return 'none';
    return `#${this.hex}`;
  }

  toString() {
    if (this.isNone) return 'none';
    return this.toRGBString();
  }

  removeNaNs() {
    // HACK BUT IT WORKS FOR NOW LOL FUCK NAN
    if (isNaN(this.r)) {
      this.r = 0;
    }
    if (isNaN(this.g)) {
      this.g = 0;
    }
    if (isNaN(this.b)) {
      return (this.b = 0);
    }
  }

  equal(c) {
    return this.toHexString() === c.toHexString();
  }

  updateHex() {
    return (this.hex = this.rgbToHex(this.r, this.g, this.b));
  }
}

window.Color = Color;
