import Tool from 'ui/tools/tool';
import Bounds from 'geometry/bounds'

export default class Zoom extends Tool {
  constructor(editor) {
    super(editor);

    this.dragStart = null;
    this.dragEnd = null;
  }

  handleMousemove(e, posn) {
  }

  handleMousedown(e, posn) {
  }

  handleClick(e, posn) {
  }

  handleDragStart(e, posn, lastPosn) {
    this.dragStart = lastPosn;
  }

  handleDrag(e, posn, lastPosn) {
    this.dragEnd = posn;
  }

  handleDragStop(e, posn) {
    let bounds = Bounds.fromPosns(this.dragStart, this.dragEnd);
    let center = bounds.center();

    let screenBounds = this.editor.projection.bounds(bounds);

    let xs = this.editor.canvas.width / screenBounds.width;
    let ys = this.editor.canvas.height / screenBounds.height;

    let zs = Math.min(xs, ys);

    this.editor.setZoom(this.editor.state.zoomLevel * zs);

    this.editor.setPosition(center);

    delete this.dragStart;
    delete this.dragEnd;
  }

  refresh(layer, context) {
    // Draw any needed UI elements
    if (this.dragStart && this.dragEnd) {
      let bounds = Bounds.fromPosns(this.dragStart, this.dragEnd);
      bounds = this.editor.projection.bounds(bounds);
      context.strokeStyle = 'black';
      context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }

  }
}

