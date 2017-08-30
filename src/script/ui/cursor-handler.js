import shapes from 'lab/shapes';
import EventEmitter from 'lib/events';
import Posn from 'geometry/posn';

const body = document.querySelector('body');

export default class CursorHandler extends EventEmitter {
  constructor(cursor) {
    super();
    this.resetElements();

    cursor.on('mousemove', (e, cursor) => {
      if (!cursor.down) {
        this.checkForActive(cursor.currentPosn);
      }
      this.handleEvent('mousemove', e, cursor);
    });

    cursor.on('mousedown', (e, cursor) => {
      this.handleEvent('mousedown', e, cursor);
    });

    cursor.on('mouseup', (e, cursor) => {
      this.handleEvent('mouseup', e, cursor);

      let focused = document.querySelector(':focus');
      if (focused) {
        focused.blur();
      }
    });

    cursor.on('click', (e, cursor) => {
      this.handleEvent('click', e, cursor);
    });

    cursor.on('drag:start', (e, cursor) => {
      this.handleEvent('drag:start', e, cursor);
    });

    cursor.on('drag', (e, cursor) => {
      this.handleEvent('drag', e, cursor);
    });

    cursor.on('drag:stop', (e, cursor) => {
      this.handleEvent('drag:stop', e, cursor);
    });

    cursor.on('scroll:y', (e, cursor) => {
      this.handleEvent('scroll:y', e, cursor);
    });

    cursor.on('scroll:x', (e, cursor) => {
      this.handleEvent('scroll:x', e, cursor);
    });
  }

  handleEvent(name, event, cursor) {
    let data = {
      // Bool values
      dragging: cursor.dragging,
      down: cursor.down,
      // Posn values
      posnCurrent: this.projection.posnInvert(cursor.currentPosn)
      // Delta values
    };

    if (cursor.lastPosn) {
      data.posnLast = this.projection.posnInvert(cursor.lastPosn);
      data.deltaDragStep = data.posnCurrent.delta(data.posnLast);
    }
    if (cursor.lastDown) {
      data.posnDown = this.projection.posnInvert(cursor.lastDown);
      data.deltaDrag = data.posnCurrent.delta(data.posnDown);
    }

    event.propagateToTool = true;

    event.stopPropagation = function() {
      event.propagateToTool = false;
    };

    if (this.active) {
      let handler = this.active.handlers[name];
      if (handler) {
        handler(event, data);
      }
    }

    this.trigger(name, event, data);
  }

  checkForActive(posn) {
    for (let elem of this.elements) {
      if (elem.shape && shapes.contains(elem.shape, posn)) {
        this.active = elem;
        this.updateCursor();
        return true;
      }
    }
    delete this.active;
    this.updateCursor();
    return false;
  }

  updateCursor() {
    if (this.active) {
      if (this.active.opts.cursor) {
        body.setAttribute('cursor', this.active.opts.cursor);
      } else {
        body.removeAttribute('cursor');
      }
    } else {
      body.removeAttribute('cursor');
    }
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
    if (typeof query === 'string') {
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
    this.elements = this.elements.filter(e => {
      return e.id !== id;
    });
    delete this.elementsMap[id];
  }
}
