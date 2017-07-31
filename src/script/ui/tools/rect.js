import Tool from 'ui/tools/tool';
import Path from 'geometry/path';
import HistoryFrame from 'history/Frame';
import * as actions from 'history/actions/actions';

export default class Rect extends Tool {
  constructor(editor) {
    super(editor);
  }

  get id() {
    return 'rect';
  }

  handleMousemove(e, posn) {
  }

  handleMousedown(e, posn) {
  }

  handleClick(e, posn) {
  }

  handleDragStart(e, posn, lastPosn) {
  }

  handleDrag(e, posn, lastPosn) {
    if (!this.rect) {
      let x = lastPosn.x;
      let y = lastPosn.y;
      let width = 1//Math.abs(posn.x - lastPosn.x);
      let height = 1//Math.abs(posn.y - lastPosn.y);

      this.scaleOrigin = lastPosn;

      this.rect = Path.rectangle({ x, y, width, height, fill: '#ccccee', stroke: '#000000' });

      this.currentIndex = this.editor.state.layer.nextChildIndex();

      let frame = new HistoryFrame([
        new actions.InsertAction({
          items: [
            { item: this.rect, index: this.currentIndex }
          ]
        }),
        new actions.ScaleAction({
          indexes: [this.currentIndex],
          x: 1, y: 1, 
          origin: this.scaleOrigin
        })
      ]);

      this.editor.perform(frame);
    }

    let x = 1;
    let y = 1;

    x = Math.abs(posn.x - this.scaleOrigin.x) / this.rect.bounds().width
    y = Math.abs(posn.y - this.scaleOrigin.y) / this.rect.bounds().height

    if (x === 0) x = 1;
    if (y === 0) y = 1;

    if (
        (posn.x < this.scaleOrigin.x && this.rect.bounds().l === this.scaleOrigin.x) ||
        (posn.x > this.scaleOrigin.x && this.rect.bounds().r === this.scaleOrigin.x)
      ) {
      // Flip
      x *= -1;
    }

    if (
        (posn.y < this.scaleOrigin.y && this.rect.bounds().t === this.scaleOrigin.y) ||
        (posn.y > this.scaleOrigin.y && this.rect.bounds().b === this.scaleOrigin.y)
      ) {
      // Flip
      y *= -1;
    }

    //this.editor.scaleSelected(x, y, this.scaleOrigin);

    if (x !== 1 || y !== 1) {
      let action = new actions.ScaleAction({
        indexes: [this.currentIndex], x, y, origin: this.scaleOrigin
      });

      this.editor.perform(action);
    }
  }

  handleDragStop(e, posn) {
    this.editor.selectFromIndexes([this.currentIndex]);
    this.editor.history.head.seal();

    delete this.currentIndex;
    delete this.scaleOrigin;
    delete this.rect;
  }

  refresh(layer, context) {
  }
}

