// Util for measuring text with a throaway canvas element

let canvas = document.createElement('canvas');
let context = canvas.getContext('2d');

export function measure(value, style) {
  context.font = style;
  return context.measureText(value);
}
