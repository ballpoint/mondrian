import proto from 'proto/schema';

export default class Index {
  constructor(parts) {
    if (!parts) {
      console.error('Invalid Index', parts);
      return;
    }
    this.parts = parts;
  }

  toProto() {
    return proto.geometry.Index.fromObject({
      parts: this.parts
    });
  }

  static fromProto(index) {
    return new Index(
      index.parts.map(x => {
        return x.toNumber();
      })
    );
  }

  clone() {
    return new Index(this.parts);
  }

  get length() {
    return this.parts.length;
  }

  get depth() {
    return this.length - 1;
  }

  toString() {
    return this.parts.join(':');
  }

  static fromString(index) {
    return new Index(
      index.split(':').map(i => {
        return parseInt(i, 10);
      })
    );
  }

  compare(other) {
    let minL = Math.min(this.length, other.length);
    for (let i = 0; i < minL; i++) {
      let mp = this.parts[i];
      let op = other.parts[i];

      if (mp < op) {
        return -1;
      } else if (mp > op) {
        return 1;
      }
    }

    // The common parts are equal
    if (this.length < other.length) {
      return -1;
    } else if (other.length < this.length) {
      return 1;
    }

    return 0;
  }

  equal(other) {
    return this.toString() === other.toString();
  }

  concat(parts) {
    return new Index(this.parts.concat(parts));
  }

  get last() {
    return this.parts[this.parts.length - 1];
  }

  get parent() {
    return new Index(this.parts.slice(0, this.parts.length - 1));
  }

  plus(n) {
    let parts = this.parts.slice(0);
    parts[parts.length - 1] += n;
    return new Index(parts);
  }

  plusAt(n, depth) {
    let parts = this.parts.slice(0);
    parts[depth] += n;
    return new Index(parts);
  }
}

export function sortIndexes(indexes) {
  return indexes.sort((a, b) => {
    return a.compare(b);
  });
}

export function indexesIdentical(ia, ib) {
  ia = sortIndexes(ia);
  ib = sortIndexes(ib);
  return ia.join(',') === ib.join(',');
}
