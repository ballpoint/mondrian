import consts from 'consts';
import Tool from 'ui/tools/tool';
import Posn from 'geometry/posn';
import Bounds from 'geometry/bounds';
import Text from 'geometry/text';

import HistoryFrame from 'history/Frame';
import * as actions from 'history/actions/actions';

export default class Type extends Tool {
  constructor(editor) {
    super(editor);

    this.nextIndex = this.editor.doc.state.layer.nextChildIndex();
  }

  get id() {
    return 'type';
  }

  handleDrag(e, cursor) {
    this.insertTextItem(cursor.posnCurrent, cursor.posnDown);
  }

  handleDragStop(e, cursor) {
    this.editor.commitFrame();
    this.editor.editText(this.nextIndex);
    delete this._dragRect;
  }

  handleClick(e, cursor) {
    if (this.editor.state.textEditHandler) {
      this.editor.finishEditingText();

      if (this.currentItem) {
        if (this.currentItem.data.value === '') {
          this.editor.selectItems([]);
        } else {
          this.editor.selectItems([this.currentItem]);
        }
        delete this.currentItem;
      }

      delete this._dragRect;
    } else {
      this.insertTextItem(cursor.posnCurrent);
      this.editor.commitFrame();
      this.editor.editText(this.nextIndex);
    }
  }

  insertTextItem(p1, p2) {
    if (p2 === undefined) {
      p2 = p1.clone().nudge(200, -12);
    }

    let b = Bounds.fromPosns([p1, p2]);

    this._dragRect = b;

    this.currentItem = new Text(
      this.editor.state.attributes.forType(Text, {
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height
      })
    );

    let frame = new HistoryFrame(
      [
        new actions.InsertAction({
          items: [
            {
              item: this.currentItem,
              index: this.nextIndex
            }
          ]
        })
      ],
      'Insert text'
    );

    this.editor.stageFrame(frame);
  }

  refresh(layer, context) {
    if (this._dragRect) {
      layer.drawRect(this.editor.projection.bounds(this._dragRect), {
        stroke: consts.blue
      });
    }
  }
}
