// Does phrase exist within a string, verbatim?
String.prototype.mentions = function(phrase) {
  if (typeof(phrase) === 'string') {
    return this.indexOf(phrase) > -1;
  } else if (phrase instanceof Array) {
    for (let p of Array.from(phrase)) {
      if (this.mentions(p)) { return true; }
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
}

Array.prototype.remove = function(el) {
  if (el instanceof RegExp) {
    return this.filter(a => !el.test(a));
  } else {
    if (el instanceof Array) {
      return this.filter(a => !el.has(a));
    } else {
      return this.filter(a => el !== a);
    }
  }
}

Number.prototype.within = function(tolerance, other) {
  // I/P: Two numbers
  // O/P: Is this within tolerance of other?
  let d = this - other;
  return (d < tolerance) && (d > -tolerance);
};

