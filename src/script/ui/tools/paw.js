import Tool from 'ui/tools/tool';

export default class Paw extends Tool {
  constructor(editor) {
    super(editor);
  }

  handleDrag(posn, lastPosn) {
    let xd = posn.x - lastPosn.x;
    let yd = posn.y - lastPosn.y;

    xd /= this.editor.state.zoomLevel;
    yd /= this.editor.state.zoomLevel;

    this.editor.nudge(-xd, -yd)
  }

}
