import Range from 'geometry/range';
import EventEmitter from 'lib/events';

const ACCEPTED = [
  new Range(8, 9), // Backspace, Enter
  new Range(13, 13), // Enter
  new Range(46, 46), // Delete
  new Range(65, 90), // a-z
  new Range(32, 32), // Space
  new Range(37, 40), // Arrow keys
  new Range(48, 57), // 0-9
  new Range(187, 190), // - + .
  new Range(219, 222) // [ ] \ '
];

const REMAPS = {
  [8]: 'backspace',
  [46]: 'delete',
  [13]: 'enter',
  [32]: 'space',
  [37]: 'leftArrow',
  [38]: 'upArrow',
  [39]: 'rightArrow',
  [40]: 'downArrow',
  [187]: '+',
  [188]: ',',
  [189]: '-',
  [190]: '.',
  [219]: '[',
  [220]: '\\',
  [221]: ']',
  [222]: "'"
};

export default class HotkeyTracking extends EventEmitter {
  constructor() {
    super();

    this.listeners = {
      down: {},
      up: {}
    };

    document.onkeydown = this.onKeydown.bind(this);
    document.onkeyup = this.onKeyup.bind(this);
  }

  on(direction, hotkey, fn) {
    if (this.listeners[direction][hotkey] === undefined) {
      this.listeners[direction][hotkey] = [];
    }

    this.listeners[direction][hotkey].push(fn);
  }

  handle(direction, hotkey, e) {
    if (e.target.nodeName.toLowerCase() === 'input') {
      return;
    }

    let handlers = this.listeners[direction][hotkey];
    if (handlers) {
      for (let h of handlers) {
        h(e);
      }
    }
  }

  whitelistedChar(e) {
    let accepted = false;
    for (let range of ACCEPTED) {
      if (range.containsInclusive(e.which)) {
        accepted = true;
      }
    }
    return accepted;
  }

  keystrokeFor(e) {
    if (!this.whitelistedChar(e)) return null;

    return REMAPS[e.which] || String.fromCharCode(e.which);
  }

  fullKeystrokeFor(e) {
    if (!this.whitelistedChar(e)) return null;

    let parts = [];
    if (e.ctrlKey || e.metaKey) {
      parts.push('ctrl');
    }
    if (e.shiftKey) {
      parts.push('shift');
    }
    if (e.altKey) {
      parts.push('alt');
    }
    parts.push(this.keystrokeFor(e));

    return parts.join('-');
  }

  onKeydown(e) {
    let stroke = this.fullKeystrokeFor(e);
    if (stroke === undefined) {
      console.log(e.which);
      return;
    }
    console.log(stroke);
    this.handle('down', stroke, e);
  }

  onKeyup(e) {
    let stroke = this.keystrokeFor(e);
    this.handle('up', stroke, e);
  }
}
