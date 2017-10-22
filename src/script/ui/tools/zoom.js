import Tool from 'ui/tools/tool';
import Bounds from 'geometry/bounds';

export default class Zoom extends Tool {
  constructor(editor) {
    super(editor);

    this.dragStart = null;
    this.dragEnd = null;
  }

  get id() {
    return 'zoom';
  }

  handleMousemove(e, cursor) {}

  handleMousedown(e, cursor) {}

  handleMouseup(e, cursor) {}

  handleClick(e, cursor) {
    if (e.altKey) {
      this.editor.zoomOut(this.editor.cursor.lastPosn);
    } else {
      this.editor.zoomIn(this.editor.cursor.lastPosn);
    }
  }

  handleDoubleClick(e, cursor) {
    this.handleClick(e, cursor);
  }

  handleDragStart(e, cursor) {
    this.dragStart = cursor.posnDown;
  }

  handleDrag(e, cursor) {
    this.dragEnd = cursor.posnCurrent;
  }

  handleDragStop(e, cursor) {
    let bounds = Bounds.fromPosns([this.dragStart, this.dragEnd]);
    let center = bounds.center();

    let screenBounds = this.editor.projection.bounds(bounds);

    let xs = this.editor.canvas.width / screenBounds.width;
    let ys = this.editor.canvas.height / screenBounds.height;

    let zs = Math.min(xs, ys);

    this.editor.setZoom(this.editor.doc.state.zoomLevel * zs);

    this.editor.setPosition(center);

    delete this.dragStart;
    delete this.dragEnd;
  }

  refresh(layer, context) {
    // Draw any needed UI elements
    if (this.dragStart && this.dragEnd) {
      let bounds = Bounds.fromPosns([this.dragStart, this.dragEnd]);
      bounds = this.editor.projection.bounds(bounds);
      context.strokeStyle = 'black';
      context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }
  }
}
