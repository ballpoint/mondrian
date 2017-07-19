export default {
  info(msg) {
    if (window.LOGLEVEL >= 2) {
      console.info(msg);
    }
  },
  verbose(msg) {
    if (window.LOGLEVEL >= 3) {
      console.info(msg);
    }
  }
}
