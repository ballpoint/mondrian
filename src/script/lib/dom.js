export function insideOf(elem, target) {
  while (elem) {
    if (elem === target) return true;
    elem = elem.parentNode;
  }
  return false;
}
