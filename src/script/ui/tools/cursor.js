import shapes from 'lab/shapes';
import Tool from 'ui/tools/tool';
import Bounds from 'geometry/bounds';

export default class Cursor extends Tool {
  constructor(editor) {
    super(editor);

    this.hovering = null;
    this.dragSelectStart = null;
    this.dragSelectEnd = null;
  }

  get id() {
    return 'cursor';
  }

  handleMousemove(e, posn) {
    if (this.editor.cursor.dragging) {
      return;
    }

    delete this.hovering;

    if (!this.editor.doc) return;

    let elems = this.editor.doc.elements.slice(0).reverse();

    for (let element of elems) {
      if (shapes.contains(element, posn)) {
        this.hovering = element;
        break;
      }
    }

  }

  handleMousedown(e, posn) {
    if (this.hovering) {
      if (!this.editor.state.selection.has(this.hovering)) {
        this.editor.setSelection([this.hovering]);
      }
    } else {
      this.editor.setSelection([]);
    }
  }

  handleClick(e, posn) {
  }

  handleDragStart(e, posn, lastPosn) {
    console.log(this.editor.state.selection.length);
    if (this.editor.state.selection.length === 0) {
      this.dragSelectStart = lastPosn;
    }
  }

  handleDrag(e, posn, lastPosn) {
    if (this.dragSelectStart) {
      this.dragSelectEnd = posn;
    } else if (this.editor.state.selection.length > 0) {
      let xd = posn.x - lastPosn.x;
      let yd = posn.y - lastPosn.y;

      this.editor.nudgeSelected(xd, yd);
    }
  }

  handleDragStop(e, posn, startPosn) {
    if (this.dragSelectStart) {
      let bounds = Bounds.fromPosns([this.dragSelectStart, this.dragSelectEnd])

      let newSelection = [];

      let elems = this.editor.doc.elements.slice(0).reverse();
      for (let elem of elems) {
        if (shapes.overlap(bounds, elem)) {
          newSelection.push(elem);
        }
      }

      this.editor.setSelection(newSelection);

      this.dragSelectStart = null;
      this.dragSelectEnd = null;
    }
  }

  refresh(layer, context) {
    if (this.dragSelectStart && this.dragSelectEnd) {
      let bounds = Bounds.fromPosns([this.dragSelectStart, this.dragSelectEnd]);
      bounds = this.editor.projection.bounds(bounds).sharp();
      layer.setLineWidth(1);
      layer.drawRect(bounds, { stroke: 'black' });
    }
  }
}
