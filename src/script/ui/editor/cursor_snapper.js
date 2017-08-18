import consts from 'consts';
import UIElement from 'ui/editor/ui_element';
import Posn from 'geometry/posn';

export default class CursorSnapperUIElement extends UIElement {
  reset() {}

  _refresh(layer, context) {
    let ann = this.annotation;
    if (!ann) return;

    switch (ann.type) {
      case 'line':
        layer.drawLineSegment(ann.p1, ann.p2, {
          stroke: consts.blue
        });
    }
  }

  handle(e, posn) {
    let tool = this.editor.state.tool;
    let cursor = this.editor.cursor;
    let activeElement = this.editor.cursorHandler.active;
    let sb = this.editor.state.selectionBounds.bounds;

    if (!sb) return posn;

    delete this.annotation;

    if (tool.id === 'cursor') {
      if (cursor.dragging) {
        if (activeElement) {
          let id = activeElement.id;
          // Dragging UI element
          if (e.shiftKey) {
            switch (id) {
              case 'transformer:scale:br':
              case 'transformer:scale:tr':
              case 'transformer:scale:bl':
              case 'transformer:scale:tl':
                console.log(id);
            }
          }
        } else if (this.editor.state.selection.length > 0) {
          // Dragging doc elements

          if (e.shiftKey) {
            let center = this.editor.projection.posn(sb.center());
            let ddelta = cursor.dragDeltaTotal;

            if (!ddelta) return posn;

            let lastDown = cursor.lastDown;
            // Snap to 45 deg
            let a = posn.angle360(lastDown);

            for (let as = 0; as < 360; as += 45) {
              let min = as - 45 / 2;
              let max = as + 45 / 2;

              let matches = false;
              if (min < 0 && a >= 360 - 45) {
                matches = a - 360 > min && a - 360 < max;
              } else {
                matches = a > min && a < max;
              }

              if (matches) {
                // Found the correct snapping angle
                switch (as) {
                  case 0:
                  case 180:
                    posn.x = lastDown.x;
                    break;
                  case 90:
                  case 270:
                    posn.y = lastDown.y;
                    break;
                  default:
                    let d = posn.distanceFrom(lastDown);
                    let xp = lastDown
                      .clone()
                      .nudge(0, -d * 2)
                      .rotate(as, lastDown);
                    let xls = new LineSegment(lastDown, xp);
                    posn = xls.closestPosn(posn);
                }

                this.annotation = {
                  type: 'line',
                  p1: new Posn(center.x - ddelta.x, center.y - ddelta.y),
                  p2: new Posn(center.x, center.y)
                };

                return posn;

                break;
              }
            }
          } else {
            // Snap to doc, grid (and possibly other elems later)
            let opts = [];
          }
        }
      }
    }
    return posn;
  }
}
