import Tool from 'ui/tools/tool';

export default class Paw extends Tool {
  constructor(editor) {
    super(editor);
  }

  handleDrag(e, posn, lastPosn) {
    let xd = posn.x - lastPosn.x;
    let yd = posn.y - lastPosn.y;

    this.editor.nudge(-xd, -yd);
  }
}
