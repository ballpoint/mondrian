import Tool from 'ui/tools/tool';
import Path from 'geometry/path';
import HistoryFrame from 'history/Frame';
import * as actions from 'history/actions/actions';

export default class Ellipse extends Tool {
  constructor(editor) {
    super(editor);
  }

  get id() {
    return 'ellipse';
  }

  handleMousemove(e, cursor) {}

  handleMousedown(e, cursor) {}

  handleMouseup(e, cursor) {}

  handleClick(e, cursor) {}

  handleDragStart(e, cursor) {
    console.log('drag start');
    this.index = this.editor.doc.state.layer.nextChildIndex();
  }

  handleDrag(e, cursor) {
    console.log('drag');
    let { posnCurrent, posnDown } = cursor;
    let rx, ry, cx, cy;

    let maxX = Math.max(posnCurrent.x, posnDown.x);
    let minX = Math.min(posnCurrent.x, posnDown.x);
    let maxY = Math.max(posnCurrent.y, posnDown.y);
    let minY = Math.min(posnCurrent.y, posnDown.y);

    // If SHIFT && ALT, draw perfect circle using down posn as center
    // If SHIFT, draw perfect circle within rectangular bounds
    // If ALT, draw ellipse using down posn as center

    if (e.shiftKey && e.altKey) {
      cx = posnDown.x;
      cy = posnDown.y;
      rx = posnCurrent.distanceFrom(posnDown);
      ry = rx;
    } else if (e.shiftKey) {
      rx = (maxX - minX) / 2;
      ry = (maxY - minY) / 2;
      rx > ry ? (ry = rx) : (rx = ry);
      cx = minX + rx;
      cy = minY + ry;
    } else if (e.altKey) {
      rx = maxX - minX;
      ry = maxY - minY;
      cx = posnDown.x;
      cy = posnDown.y;
    } else {
      rx = (maxX - minX) / 2;
      ry = (maxY - minY) / 2;
      cx = minX + rx;
      cy = minY + ry;
    }

    let ellipse = Path.ellipse(
      this.editor.state.attributes.forType(Path, {
        cx,
        cy,
        rx,
        ry
      })
    );

    let frame = new HistoryFrame(
      [
        new actions.InsertAction({
          items: [{ item: ellipse, index: this.index }]
        })
      ],
      'Draw ellipse'
    );

    this.editor.stageFrame(frame);
  }

  handleDragStop(e, posn) {
    this.editor.selectFromIndexes([this.index]);
    this.editor.commitFrame();

    delete this.index;
  }

  refresh(layer, context) {}
}
