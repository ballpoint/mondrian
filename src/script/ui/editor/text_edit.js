import consts from 'consts';
import Bounds from 'geometry/bounds';
import UIElement from 'ui/editor/ui_element';
import Element from 'ui/element';

const HL_BLUE = consts.blue.mix(consts.white, 0.3);

export default class TextEditUIElement extends UIElement {
  reset() {
    this.editor.cursorHandler.unregisterElement('text:edit-area');
  }

  _refresh(layer, context) {
    this.reset();

    let handler = this.editor.state.textEditHandler;
    if (handler === undefined) return;

    let lineBounds = [];
    let lines = handler.item.lines();

    for (let line of lines) {
      lineBounds.push(handler.item.lineBounds(line));
    }

    if (handler.selection) {
      let { start, end } = handler.selection;
      // Draw blue selection
      let posnStart = handler.item.posnAtCursorPosition(start);
      let posnEnd = handler.item.posnAtCursorPosition(end);

      // Figure out the lines we have to highlight
      let highlights = [];
      let position = 0;

      // Split highlights on newlines
      if (end > start) {
        for (let line of lines) {
          let v = line.data.value;
          if (highlights.length === 0) {
            if (position + v.length >= start) {
              if (position + v.length >= end) {
                highlights.push({ start, end });
                break;
              } else {
                highlights.push({ start, end: position + v.length });
              }
            }
          } else {
            if (position + v.length <= end) {
              highlights.push({ start: position, end: position + v.length });
            } else {
              highlights.push({ start: position, end });
              break;
            }
          }
          position += v.length + 1;
        }
      }

      // Draw blue highlights
      for (let i = 0; i < highlights.length; i++) {
        let hl = highlights[i];
        let posnStart = handler.item.posnAtCursorPosition(hl.start, i > 0);
        let posnEnd = handler.item.posnAtCursorPosition(hl.end);

        let p1 = this.editor.projection.posn(posnStart);
        let p2 = this.editor.projection.posn(
          posnEnd
            .clone()
            .nudge(0, -handler.item.data.size * handler.item.data.spacing)
        );

        layer.drawRect(
          Bounds.fromPosns([
            this.editor.projection.posn(
              posnStart
                .clone()
                .nudge(
                  0,
                  handler.item.data.size * (handler.item.data.spacing - 1)
                )
            ),
            p2
          ]),
          {
            fill: HL_BLUE
          }
        );

        let valueSlice = handler.item.data.value
          .slice(hl.start, hl.end)
          .split('\n');

        context.save();
        context.translate(p1.x, p1.y);
        context.scale(this.editor.projection.z(1), this.editor.projection.z(1));

        context.font = handler.item.fontStyle();

        context.fillStyle = 'white';

        context.fillText(valueSlice, 0, 0);
        context.restore();
      }

      // Draw cursor
      layer.drawLineSegment(
        this.editor.projection.posn(
          posnEnd
            .clone()
            .nudge(0, -handler.item.data.size * handler.item.data.spacing)
        ),
        this.editor.projection.posn(
          posnEnd
            .clone()
            .nudge(0, handler.item.data.size * (handler.item.data.spacing - 1))
        ),
        {
          stroke: consts.blue,
          strokeWidth: 3
        }
      );
    }

    let fullEditBounds = this.editor.projection.bounds(
      Bounds.fromBounds(lineBounds)
    );

    let textEditArea = new Element(
      'text:edit-area',
      fullEditBounds,
      {
        mousedown: e => {
          e.stopPropagation();
        },
        mousemove: e => {},
        mouseup: e => {
          e.stopPropagation();
        },
        drag: (e, cursor) => {
          e.stopPropagation();
          let p1 = handler.item.cursorPositionAtPosn(cursor.posnDown);
          let p2 = handler.item.cursorPositionAtPosn(cursor.posnCurrent);
          handler.setCursorPosition(Math.min(p1, p2), Math.max(p1, p2));
        },
        'drag:stop': (e, cursor) => {
          e.stopPropagation();
        },
        click: (e, cursor) => {
          e.stopPropagation();
          let position = handler.item.cursorPositionAtPosn(cursor.posnCurrent);
          handler.setCursorPosition(position, position);
        },
        doubleclick: (e, cursor) => {
          // highlight selected word
        }
      },
      {
        cursor: 'text'
      }
    );

    this.editor.cursorHandler.registerElement(textEditArea, {
      canActivateImmediately: true
    });
  }
}
