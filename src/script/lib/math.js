export const PIXEL_RATIO = Math.ceil(2 ||  window.devicePixelRatio || 1);

export default {
  roundTo(n, r) {
    let off = n % r
    if (off <= (r / 2)) {
      return n - off
    } else {
      return n + (r - off)
    }
  },

  roundDownTo(n, r) {
    let off = n % r
    return n - off
  },

  roundUpTo(n, r) {
    let off = n % r
    return n + (r - off)
  },

  sharpen(n) {
    return Math.floor(n) + (0.5/PIXEL_RATIO);
  }
}
