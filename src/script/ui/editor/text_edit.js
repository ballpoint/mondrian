import consts from 'consts';
import Bounds from 'geometry/bounds';
import Posn from 'geometry/posn';
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

    let item = handler.item;
    let projection = this.editor.projection;

    let center = item.bounds().center();
    let angle = item.metadata.angle;
    let fontSize = item.data['font-size'];
    let lineSpacing = item.data['line-height'];
    let selectionPadding = fontSize * ((lineSpacing - 1) / 2);

    let lineBounds = [];
    let lines = item.lines();

    for (let line of lines) {
      lineBounds.push(item.lineBounds(line));
    }

    if (handler.selection) {
      let { start, end } = handler.selection;

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
                highlights.push({ line, start, end });
                break;
              } else {
                highlights.push({ line, start, end: position + v.length });
              }
            }
          } else {
            if (position + v.length <= end) {
              highlights.push({
                line,
                start: position,
                end: position + v.length
              });
            } else {
              highlights.push({ line, start: position, end });
              break;
            }
          }
          position += v.length + 1;
        }
      }

      let z = projection.z(1);

      // Draw blue highlights
      for (let i = 0; i < highlights.length; i++) {
        let hl = highlights[i];
        let posnStart = item.posnAtCursorPosition(hl.start, i > 0);
        let posnEnd = item.posnAtCursorPosition(hl.end);
        let translateOrigin = projection.posn(
          posnStart.clone().rotate(angle, center)
        );

        let hlWidth = posnEnd.x - posnStart.x;

        context.save();
        context.translate(translateOrigin.x, translateOrigin.y);
        context.scale(z, z);
        context.rotate(angle * (Math.PI / 180));

        layer.drawRect(
          Bounds.fromPosns([
            new Posn(0, selectionPadding + projection.zInvert(1)),
            new Posn(hlWidth, -fontSize - selectionPadding)
          ]),
          {
            fill: HL_BLUE
          }
        );

        let valueSlice = item.data.value.slice(hl.start, hl.end).split('\n');

        context.font = item.fontStyle();
        context.fillStyle = 'white';

        context.fillText(valueSlice, 0, 0);
        context.restore();
      }

      let pCursor = item.posnAtCursorPosition(end);
      let translateOrigin = projection.posn(
        pCursor.clone().rotate(angle, center)
      );

      let pCursorBottom = pCursor
        .clone()
        .nudge(0, fontSize * (item.data['line-height'] - 1));

      context.save();
      context.translate(translateOrigin.x, translateOrigin.y);
      context.scale(z, z);
      context.rotate(angle * (Math.PI / 180));

      // Draw cursor
      layer.drawLineSegment(
        new Posn(0, selectionPadding),
        new Posn(0, -fontSize - selectionPadding),
        {
          stroke: consts.blue,
          strokeWidth: projection.zInvert(3)
        }
      );

      context.restore();
    }

    let fullEditBounds = projection.bounds(Bounds.fromBounds(lineBounds));

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
          let p1 = item.cursorPositionAtPosn(
            cursor.posnDown
              .clone()
              .rotate(-item.metadata.angle, item.bounds().center())
          );
          let p2 = item.cursorPositionAtPosn(
            cursor.posnCurrent
              .clone()
              .rotate(-item.metadata.angle, item.bounds().center())
          );

          handler.setCursorPosition(Math.min(p1, p2), Math.max(p1, p2));
        },
        'drag:stop': (e, cursor) => {
          e.stopPropagation();
        },
        click: (e, cursor) => {
          e.stopPropagation();
          let posn = cursor.posnCurrent
            .clone()
            .rotate(-item.metadata.angle, item.bounds().center());

          let position = item.cursorPositionAtPosn(posn);
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
