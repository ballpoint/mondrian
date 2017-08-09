export const PIXEL_RATIO = window.devicePixelRatio || 1;

export default {
  roundTo(n, r) {
    let off = n % r;
    if (off <= r / 2) {
      return n - off;
    } else {
      return n + (r - off);
    }
  },

  roundDownTo(n, r) {
    let off = n % r;
    return n - off;
  },

  roundUpTo(n, r) {
    let off = n % r;
    return n + (r - off);
  },

  sharpen(n) {
    return Math.floor(n) + 0.5 / PIXEL_RATIO;
  },

  degreesToRadians(deg) {
    return deg * (Math.PI / 180);
  },

  radiansToDegrees(rad) {
    return rad * (180 / Math.PI);
  },

  fmtFloat(n, prec) {
    return n.toFixed(prec).replace(/\.?0+$/, "");
  }
};
