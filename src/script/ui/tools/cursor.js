import shapes from 'lab/shapes';
import Tool from 'ui/tools/tool';
import Bounds from 'geometry/bounds';
import Circle from 'geometry/circle';

export default class Cursor extends Tool {
  constructor(editor) {
    super(editor);

    this.dragSelectStart = null;
    this.dragSelectEnd = null;
    this.hovering = [];

    this.skipClick = 0;
  }

  get id() {
    return 'cursor';
  }

  handleMousemove(e, posn) {
    if (this.editor.cursor.dragging) return;
    if (this.dragSelectStart) return;
    if (!this.editor.doc) return;

    let z3 = this.editor.projection.zInvert(3);
    let posnPadded = Bounds.centeredOnPosn(posn, z3, z3);

    let elems = this.editor.doc.elementsAvailable.reverse();

    this.skipClick = 0;
    this.hovering = [];

    // TODO use bsearch tree here 8)
    for (let elem of elems) {
      let bp = elem.bounds().padded(z3); 

      if (bp.contains(posn)) {
        if (shapes.contains(elem, posn)) {
          this.hovering.push(elem);
        } else if (shapes.overlap(elem, posnPadded)) {
          this.hovering.push(elem);
        }
      }
    }

    if (this.hovering.length > 0) {
      this.editor.setHovering([this.hovering[0]]);
    } else {
      this.editor.setHovering([]);
    }
  }

  handleMousedown(e, posn) {
    let selected;

    if (this.hovering.length > 0) {
      let skipClick = this.skipClick % this.hovering.length;

      if (this.hovering.length > skipClick) {
        selected = this.hovering[skipClick];
      } else {
        selected = this.hovering.last();
      }
    }

    if (selected) {
      if (!this.editor.isSelected(selected)) {
        this.editor.setSelection([selected]);

      }
    } else {
      this.editor.setSelection([]);
    }
  }

  handleClick(e, posn) {
    this.skipClick ++;
  }

  handleDragStart(e, posn, lastPosn) {
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

      let elems = this.editor.doc.elementsAvailable.reverse();
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
