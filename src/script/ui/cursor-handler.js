import shapes from 'lab/shapes';
import EventEmitter from 'lib/events';
import Posn from 'geometry/posn';

export default class CursorHandler extends EventEmitter {
  constructor(cursor) {
    super();
    this.resetElements();

    cursor.on('mousemove', (e, posn) => {
      if (!cursor.down) {
        this.checkForActive(posn);
      }
      this._lastPosn = posn;
      this.handleEvent('mousemove', e, posn);
    });

    cursor.on('mousedown', (e, posn) => {
      this.handleEvent('mousedown', e, posn);
    });

    cursor.on('click', (e, posn) => {
      this.handleEvent('click', e, posn);
    });

    cursor.on('drag:start', (e, posn, lastPosn) => {
      this.handleEvent('drag:start', e, posn, lastPosn);
    });

    cursor.on('drag', (e, posn, lastPosn) => {
      this.handleEvent('drag', e, posn, lastPosn);
    });

    cursor.on('drag:stop', (e, posn, startPosn) => {
      this.handleEvent('drag:stop', e, posn, startPosn);
    });

    cursor.on('scroll:y', (e, delta) => {
      this.handleEvent('scroll:y', e, delta);
    });

    cursor.on('scroll:x', (e, delta) => {
      this.handleEvent('scroll:x', e, delta);
    });
  }

  handleEvent(name, event, ...args) {
    args = args.map((arg) => {
      if (arg instanceof Posn) {
        return this.projection.posnInvert(arg);
      } else {
        return arg;
      }
    });

    event.propagateToTool = true;

    event.stopPropagation = function () {
      event.propagateToTool = false;
    }

    if (this.active) {
      let handler = this.active.handlers[name];
      if (handler) {
        handler(event, ...args);
      }
    }

    this.trigger(name, event, ...args);
  }

  checkForActive(posn) {
    for (let elem of this.elements) {
      if (elem.shape && shapes.contains(elem.shape, posn)) {
        this.active = elem;
        return true;
      }
    }
    delete this.active;
    return false;
  }

  isActive(id) {
    if (!this.active) return false;
    return this.active.id === id;
  }

  setActive(id) {
    for (let elem of this.elements) {
      if (elem.id === id) {
        this.active = elem;
        return;
      }
    }
  }

  resetElements() {
    this.elements = [];
    this.elementsMap = {};
  }

  registerElement(elem) {
    this.removeId(elem.id);
    this.elementsMap[elem.id] = elem;
    this.elements.push(elem);
  }

  unregisterElement(query) {
    if (typeof(query) === 'string') {
      let existing = this.elementsMap[query];
      if (existing) {
        this.removeId(query);
      }
    } else if (query instanceof RegExp) {
      for (let id in this.elementsMap) {
        if (query.test(id)) {
          this.removeId(id);
        }
      }
    }
  }

  removeId(id) {
    this.elements = this.elements.filter((e) => { return e.id !== id });
    delete this.elementsMap[id];
  }


}
