import EventEmitter from 'lib/events';
import Posn from 'geometry/posn';
import LineSegment from 'geometry/line-segment';
import { insideOf } from 'lib/dom';

const DRAG_THRESHOLD = 5;
const DOUBLE_CLICK_THRESHOLD = 500;

function isDefaultQuarantined() {
  return false;
}

export default class CursorTracking extends EventEmitter {
  constructor(root, snapHandler) {
    super();
    this.root = root;
    this.setup(root);

    this.snapHandler = snapHandler;
  }

  setup(root) {
    this.reset();

    this._clientBounds = this.root.getBoundingClientRect();

    document.addEventListener('click', this._click.bind(this));
    document.addEventListener('mousedown', this._mousedown.bind(this));
    document.addEventListener('mouseup', this._mouseup.bind(this));
    document.addEventListener('mousemove', this._mousemove.bind(this));
    document.addEventListener('mouseover', this._mouseover.bind(this));
    document.addEventListener('mousewheel', this._scroll.bind(this));
  }

  reset() {
    this.down = false;
    this.wasDownLast = false;
    this.downOn = undefined;

    this.dragging = false;
    this.draggingJustBegan = false;

    this.currentPosn = undefined;
    this.lastPosn = undefined;
    this.lastEvent = undefined;

    this.lastDown = undefined;
    this.lastDownTarget = undefined;

    this.lastUp = undefined;
    this.lastUpTarget = undefined;

    this.inHoverState = undefined;
    this.lastHoverState = undefined;

    this.resetOnNext = false;

    this.doubleclickArmed = false;

    return true;
  }

  dragAccum() {
    let s = this.lastPosn.subtract(this.lastDown);

    return {
      x: s.x,
      y: s.y
    };
  }

  armDoubleClick() {
    this.doubleclickArmed = true;
    return setTimeout(() => {
      return (this.doubleclickArmed = false);
    }, DOUBLE_CLICK_THRESHOLD);
  }

  _posnForEvent(e) {
    let px = e.pageX;
    let py = e.pageY;

    let rx = px - this._clientBounds.left;
    let ry = py - this._clientBounds.top;

    let p = new Posn(rx, ry);

    /*
    if (this.snapHandler) {
      p = this.snapHandler(e, p, this);
    }
    */

    return p;
  }

  _click(e) {
    // Quarantine check, and return if so
    if (isDefaultQuarantined(e.target)) {
      return true;
    } else {
      return e.stopPropagation();
    }
  }

  _mousedown(e) {
    if (insideOf(e.target, this.root)) {
      e.stopPropagation();

      // If the user was in an input field and we're not going back to
      // app-override interaction, blur the focus from that field

      // Also blur any text elements they may have been editing

      // Prevent the text selection cursor when dragging
      e.preventDefault();

      // Send the event to ui, which will dispatch it to the appropriate places
      this.trigger('mousedown', e, this);

      // Set tracking variables
      this.down = true;
      this.lastDown = this._posnForEvent(e);
      this.downEvent = e;
      this.downOn = e.target;
      return (this.lastDownTarget = e.target);
    }
  }

  _mouseup(e) {
    this.trigger('mouseup', e, this);
    // End dragging sequence if it was occurring
    if (this.dragging && !this.draggingJustBegan) {
      this.trigger('drag:stop', e, this);
      delete this.dragStartPosn;
    } else {
      if (this.doubleclickArmed) {
        this.doubleclickArmed = false;
        this.trigger('doubleclick', e, this);
      } else {
        // It's a static click, meaning the cursor didn't move
        // between mousedown and mouseup so no drag occurred.
        this.trigger('click', e, this);
        // HACK
        this.armDoubleClick();
      }
    }

    this.dragging = false;
    this.down = false;
    this.lastUp = this._posnForEvent(e);
    this.lastUpTarget = e.target;
    this.draggingJustBegan = false;
  }

  _mousemove(e) {
    this.doubleclickArmed = false;

    this.lastPosn = this.currentPosn;
    this.currentPosn = this._posnForEvent(e);

    this.trigger('mousemove', e, this);
    e.preventDefault();

    // Set some tracking variables
    this.wasDownLast = this.down;
    this.lastEvent = e;
    this.currentPosn = this._posnForEvent(e);

    // Initiate dragging, or continue it if it's been initiated.
    if (this.down) {
      if (this.dragging) {
        this.draggingJustBegan = false;
        // Allow for slight movement without triggering drag
      } else if (
        this.currentPosn.distanceFrom(this.lastDown) > DRAG_THRESHOLD
      ) {
        this.dragStartPosn = this.lastDown;
        this.trigger('drag:start', e, this);
        this.dragging = this.draggingJustBegan = true;
      }

      this.trigger('drag', e, this);
    }
  }

  _mouseover(e) {}

  _scroll(e) {
    if (e.deltaY !== 0) {
      this.trigger('scroll:y', e, e.deltaY, this);
    }
    if (e.deltaX !== 0) {
      this.trigger('scroll:x', e, e.deltaX, this);
    }
  }
}
