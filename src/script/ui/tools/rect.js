import Tool from 'ui/tools/tool';
import Path from 'geometry/path';
import HistoryFrame from 'history/Frame';
import * as actions from 'history/actions/actions';
import snapping from 'lib/snapping';
import { degs_45 } from 'lib/snapping';

export default class Rect extends Tool {
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
    this.index = this.editor.doc.state.layer.nextChildIndex();
  }

  handleDrag(e, cursor) {
    let { posnCurrent, posnDown } = cursor;

    posnCurrent = posnCurrent.clone();

    if (e.shiftKey) {
      posnCurrent = snapping.toDegs(posnDown, posnCurrent, degs_45);
    }

    let x = Math.min(posnCurrent.x, posnDown.x);
    let y = Math.min(posnCurrent.y, posnDown.y);
    let width = Math.abs(posnCurrent.x - posnDown.x);
    let height = Math.abs(posnCurrent.y - posnDown.y);

    if (e.altKey) {
      x -= width;
      y -= height;
      width *= 2;
      height *= 2;
    }

    let rect = Path.rectangle(
      this.editor.state.attributes.forType(Path, {
        x,
        y,
        width,
        height
      })
    );

    let frame = new HistoryFrame(
      [
        new actions.InsertAction({
          items: [{ item: rect, index: this.index }]
        })
      ],
      'Draw rectangle'
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
