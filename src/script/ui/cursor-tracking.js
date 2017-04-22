import EventEmitter from 'lib/events';
import Posn from 'geometry/posn';
import LineSegment from 'geometry/line-segment';

const DRAG_THRESHOLD = 5;
const DOUBLE_CLICK_THRESHOLD = 500;

/*

  Cursor event overriding :D

  This shit tracks exactly what the cursor is doing and implements some
  custom cursor functions like dragging, which are dispatched via the ui object.

*/

function isDefaultQuarantined() {
  return false;
}

export default class CursorTracking extends EventEmitter {

  constructor(root) {
    super();
    this.root = root;
    this.setup(root);
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

    this.snapChangeAccum = { x: 0, y: 0 };

    return true;
  }

  resetSnapChangeAccumX() {
    return this.snapChangeAccum.x = 0;
  }

  resetSnapChangeAccumY() {
    return this.snapChangeAccum.y = 0;
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
      return this.doubleclickArmed = false;
    }
    , DOUBLE_CLICK_THRESHOLD);
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
    // Quarantine check, and return if so
    if (isDefaultQuarantined(e.target)) {
      this.reset();
      return true;
    } else {
      e.stopPropagation();

      // If the user was in an input field and we're not going back to
      // app-override interaction, blur the focus from that field

      // Also blur any text elements they may have been editing

      // Prevent the text selection cursor when dragging
      e.preventDefault();

      // Send the event to ui, which will dispatch it to the appropriate places
      this.trigger('mousedown', e, this.currentPosn);

      // Set tracking variables
      this.down = true;
      this.lastDown = new Posn(e);
      this.downOn = e.target;
      return this.lastDownTarget = e.target;
    }
  }

  _mouseup(e) {
    this.trigger('mouseup', e, this.currentPosn);
    // End dragging sequence if it was occurring
    if (this.dragging && !this.draggingJustBegan) {
      this.trigger('drag:stop', e, this.currentPosn);
    } else {
      if (this.doubleclickArmed) {
        this.doubleclickArmed = false;
        console.log('doubleclick');
        this.trigger('doubleclick', e, this.currentPosn);
      } else {
        // It's a static click, meaning the cursor didn't move
        // between mousedown and mouseup so no drag occurred.
        this.trigger('click', e, this.currentPosn);
        // HACK
        this.armDoubleClick();
      }
    }

    this.dragging = false;
    this.down = false;
    this.lastUp = new Posn(e);
    this.lastUpTarget = e.target;
    this.draggingJustBegan = false;
  }

  _mousemove(e) {
    this.doubleclickArmed = false;

    this.lastPosn = this.currentPosn;
    this.currentPosn = new Posn(e);

    if (true) {
      this.trigger('mousemove', e, this.currentPosn);
      e.preventDefault();

      // Set some tracking variables
      this.wasDownLast = this.down;
      this.lastEvent = e;
      this.currentPosn = new Posn(e);

      // Initiate dragging, or continue it if it's been initiated.
      if (this.down) {
        if (this.dragging) {
          this.trigger('drag', e, this.currentPosn, this.lastPosn);
          return this.draggingJustBegan = false;
        // Allow for slight movement without triggering drag
        } else if (this.currentPosn.distanceFrom(this.lastDown) > DRAG_THRESHOLD) {
          this.trigger('drag:start', e, this.currentPosn);
          return this.dragging = (this.draggingJustBegan = true);
        }
      }
    }
  }

  _mouseover(e) {
  }

  setup(root) {
    this.reset();

    root.onclick = this._click.bind(this);
    root.onmousedown = this._mousedown.bind(this);
    root.onmouseup = this._mouseup.bind(this);
    root.onmousemove = this._mousemove.bind(this);
    root.onmouseover = this._mouseover.bind(this);

    // Reset the cursor to somewhere off the screen if they switch tabs and come back
    return window.onfocus = () => {
      return this.currentPosn = new Posn(-100, -100);
    };
  }
};
