export default class Tool {
  constructor(editor) {
    this.editor = editor;
  }

  get id() {
    return "unknown";
  }

  handleMousemove(e, posn) {}

  handleMousedown(e, posn) {}

  handleClick(e, posn) {}

  handleDragStart(e, posn, lastPosn) {}

  handleDrag(e, posn, lastPosn) {}

  handleDragStop(e, posn) {}

  refresh(layer, context) {}
}
