import shapes from 'lab/shapes';
import EventEmitter from 'lib/events';

export default class ElementLayer extends EventEmitter {
  constructor(cursor) {
    super();
    this.resetElements();

    cursor.on('mousemove', (e, posn) => {
      if (!cursor.down) {
        this.checkForActive(posn);
      }
      this.handleEvent('mousemove', e, posn);
    });

    cursor.on('mousedown', (e, posn) => {
      this.handleEvent('mousedown', e, posn);
    });

    cursor.on('click', (e, posn) => {
      this.handleEvent('click', e, posn);
    });

    cursor.on('drag:start', (e, posn, lastPosn) => {
      this.handleEvent('drag:start', e, posn);
    });

    cursor.on('drag', (e, posn, lastPosn) => {
      this.handleEvent('drag', e, posn, lastPosn);
    });

    cursor.on('drag:stop', (e, posn, lastPosn) => {
      this.handleEvent('drag:stop', e, posn, lastPosn);
    });
  }

  handleEvent(name, event, ...args) {
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

  resetElements() {
    this.elements = [];
    this.elementsMap = {};
  }

  registerElement(elem) {
    let existing = this.elementsMap[elem.id];
    if (existing) {
      // Replace it
      let index = existing.index;
      elem.index = index;
      this.elements[index] = elem;
      this.elementsMap[elem.id] = elem;
    } else {
      elem.index = this.elements.length;
      this.elements.push(elem);
      this.elementsMap[elem.id] = elem;
    }
  }

  unregisterElement(id) {
    let existing = this.elementsMap[id];
    if (existing) {
      this.elements = this.elements.removeIndex(existing.index);
      delete this.elementsMap[id];
    }
  }


}
