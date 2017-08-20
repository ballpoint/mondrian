import Tool from 'ui/tools/tool';
import Path from 'geometry/path';
import HistoryFrame from 'history/Frame';
import * as actions from 'history/actions/actions';

export default class Ellipse extends Tool {
  constructor(editor) {
    super(editor);
  }

  get id() {
    return 'rect';
  }

  handleMousemove(e, cursor) {}

  handleMousedown(e, cursor) {}

  handleMouseup(e, cursor) {}

  handleClick(e, cursor) {}

  handleDragStart(e, cursor) {
    this.index = this.editor.state.layer.nextChildIndex();
  }

  handleDrag(e, cursor) {
    let { posnCurrent, posnDown } = cursor;
    let rx, ry, cx, cy;

    let maxX = Math.max(posnCurrent.x, posnDown.x);
    let minX = Math.min(posnCurrent.x, posnDown.x);
    let maxY = Math.max(posnCurrent.y, posnDown.y);
    let minY = Math.min(posnCurrent.y, posnDown.y);

    if (e.shiftKey && e.altKey) {
      rx = posnCurrent.distanceFrom(posnDown);
      ry = rx;
    } else {
      rx = (maxX - minX) / 2;
      ry = (maxY - minY) / 2;
    }

    if (e.altKey) {
      cx = posnDown.x;
      cy = posnDown.y;

      if (!e.shiftKey) {
        rx *= 2;
        ry *= 2;
      }
    } else {
      cx = minX + rx;
      cy = minY + ry;
    }

    this.rect = Path.ellipse({
      cx,
      cy,
      rx,
      ry,
      fill: this.editor.state.colors.fill,
      stroke: this.editor.state.colors.stroke
    });

    let frame = new HistoryFrame(
      [
        new actions.InsertAction({
          items: [{ item: this.rect, index: this.index }]
        })
      ],
      'Draw ellipse'
    );

    this.editor.stageFrame(frame);
  }

  handleDragStop(e, posn) {
    this.editor.selectFromIndexes([this.index]);
    this.editor.commitFrame();

    delete this.rect;
    delete this.index;
  }

  refresh(layer, context) {}
}
