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


