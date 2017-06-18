export default class Query {
  constructor(indices) {
    this.indices = indices;
  }

  // 0:0:1 <- less
  // 0:0:2
  //
  // 0:1 <- less
  // 1

  get length() {
    return this.indices.length;
  }

  toString() {
    return this.indices.join(':');
  }

  static fromString(query) {
    return new Query(query.split(':').map((i) => { return parseInt(i,10) }));
  }

  less(other) {
    let minL = Math.min(this.length, other.length);
    for (let i = 0; i < minL; i ++) {
      let mp = this.indices[i];
      let op = other.indices[i];

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
}
