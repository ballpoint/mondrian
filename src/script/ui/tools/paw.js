import Tool from 'ui/tools/tool';

export default class Paw extends Tool {
  constructor(editor) {
    super(editor);
  }

  handleDrag(e, cursor) {
    this.editor.nudge(-cursor.deltaDragStep.x, -cursor.deltaDragStep.y);
  }
}
