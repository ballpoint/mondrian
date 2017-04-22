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
    return this.roundTo(n, 0.5);
  }
}
