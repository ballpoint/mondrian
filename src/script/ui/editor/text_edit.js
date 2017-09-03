import consts from 'consts';
import Bounds from 'geometry/bounds';
import UIElement from 'ui/editor/ui_element';

export default class TextEditUIElement extends UIElement {
  reset() {}

  _refresh(layer, context) {
    this.reset();

    let handler = this.editor.state.textEditHandler;
    if (handler === undefined) return;

    if (handler.selection) {
      let { start, end } = handler.selection;
      // Draw blue selection
      let posnStart = handler.item.posnAtCursorPosition(start);
      let posnEnd = handler.item.posnAtCursorPosition(end);

      // Figure out the lines we have to highlight
      let highlights = [];
      let lines = handler.item.lines();
      let position = 0;

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

      for (let i = 0; i < highlights.length; i++) {
        let hl = highlights[i];
        let posnStart = handler.item.posnAtCursorPosition(hl.start, i > 0);
        let posnEnd = handler.item.posnAtCursorPosition(hl.end);

        let p1 = this.editor.projection.posn(posnStart);
        let p2 = this.editor.projection.posn(
          posnEnd.nudge(0, -handler.item.data.size)
        );

        layer.drawRect(Bounds.fromPosns([p1, p2]), {
          fill: consts.blue
        });

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
        this.editor.projection.posn(posnEnd),
        this.editor.projection.posn(posnEnd.nudge(0, -handler.item.data.size)),
        {
          stroke: consts.blue,
          strokeWidth: 3
        }
      );
    }
  }
}
