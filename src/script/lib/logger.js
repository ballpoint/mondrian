export default {
  info() {
    if (window.LOGLEVEL >= 2) {
      console.info(...arguments);
    }
  },
  verbose() {
    if (window.LOGLEVEL >= 3) {
      console.info(...arguments);
    }
  }
}
