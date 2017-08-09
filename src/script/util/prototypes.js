// Does phrase exist within a string, verbatim?
String.prototype.mentions = function(phrase) {
  if (typeof phrase === "string") {
    return this.indexOf(phrase) > -1;
  } else if (phrase instanceof Array) {
    for (let p of Array.from(phrase)) {
      if (this.mentions(p)) {
        return true;
      }
    }
    return false;
  }
};

Array.prototype.has = function(el) {
  if (el instanceof Function) {
    return this.filter(el).length > 0;
  } else {
    return this.indexOf(el) > -1;
  }
};

Array.prototype.removeIndex = function(index) {
  return this.slice(0, index).concat(this.slice(index + 1));
};

Array.prototype.last = function() {
  return this[this.length - 1];
};

Array.prototype.remove = function(el) {
  if (el instanceof RegExp) {
    return this.filter(a => !el.test(a));
  } else if (el instanceof Array) {
    return this.filter(a => !el.has(a));
  } else {
    return this.filter(a => el !== a);
  }
};

Array.prototype.insertAt = function(elem, i) {
  return this.slice(0, i).concat([elem]).concat(this.slice(i));
};

Number.prototype.within = function(tolerance, other) {
  // I/P: Two numbers
  // O/P: Is this within tolerance of other?
  let d = this - other;
  return d < tolerance && d > -tolerance;
};

String.prototype.strip = function() {
  return this.replace(/^\s*/, "").replace(/\s*$/, "");
};

Array.prototype.sameMembers = function(other) {
  if (this.length !== other.length) return false;

  for (let i = 0; i < this.length; i++) {
    let mem = this[i];
    if (other.indexOf(mem) === -1) return false;
  }
  return true;
};

Math.KAPPA = 0.5522847498307936;
