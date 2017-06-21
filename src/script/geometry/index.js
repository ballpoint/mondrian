export default class Index {
  constructor(parts) {
    if (!parts) {
      console.error('Invalid Index', parts);
      return;
    }
    this.parts = parts;
  }

  get length() {
    return this.parts.length;
  }

  toString() {
    return this.parts.join(':');
  }

  static fromString(index) {
    return new Index(index.split(':').map((i) => { return parseInt(i,10) }));
  }

  less(other) {
    let minL = Math.min(this.length, other.length);
    for (let i = 0; i < minL; i ++) {
      let mp = this.parts[i];
      let op = other.parts[i];

      if (mp < op) {
        return true;
      } else if (mp > op) {
        return false;
      }
    }

    return false;
  }

  equal(other) {
    return this.toString() === other.toString();
  }

  concat(parts) {
    return new Index(this.parts.concat(parts));
  }

  get last() {
    return this.parts[this.parts.length-1];
  }
}
