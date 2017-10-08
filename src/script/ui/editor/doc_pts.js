import consts from 'consts';
import Circle from 'geometry/circle';
import Element from 'ui/element';
import UIElement from 'ui/editor/ui_element';
import Selection from 'ui/selection';
import { ELEMENTS, POINTS, PHANDLE, SHANDLE } from 'ui/selection';

export default class DocumentPointsUIElement extends UIElement {
  reset() {
    this.editor.cursorHandler.unregisterElement(/selectedPoint.*/);
  }

  _refresh(layer, context) {
    this.reset();

    let tool = this.editor.state.tool;

    if (tool.id === 'subcursor') {
      for (let elem of this.editor.doc.elementsFlat) {
        if (!elem.points) continue;
        let points = elem.points.all();
        for (let i = 0; i < points.length; i++) {
          let pt = points[i];
          if (!this.editor.state.selection.has(pt)) {
            if (pt !== tool.hovering) {
              layer.drawCircle(this.editor.projection.posn(pt), 2.5, {
                stroke: consts.point,
                fill: 'white'
              });
            }
          }
        }
      }

      if (tool.hovering && !this.editor.state.selection.has(tool.hovering)) {
        this.handlePoint(tool.hovering, layer);
      }
    }

    // Don't draw selected points when we're manipulating points
    if (tool.id === 'pen' && tool.closest) {
      return;
    }

    if (this.editor.state.selection.isOfType([POINTS, PHANDLE, SHANDLE])) {
      // draw selected pts
      for (let pt of this.editor.state.selection.items) {
        this.handlePoint(pt, layer, {
          includeHandles: this.editor.state.selection.length === 1
        });
      }
    }
  }

  handlePoint(pt, layer, opts = {}) {
    let mainPosn = this.editor.projection.posn(pt);

    // Control points
    if (opts.includeHandles) {
      for (let name of ['sHandle', 'pHandle']) {
        let handle = pt[name];
        if (!handle) continue;

        let sp = this.editor.projection.posn(handle);
        let id = 'selectedPoint:' + pt.index.toString() + ':' + name;
        layer.drawLineSegment(mainPosn, sp, { stroke: consts.point });

        this.drawPoint(id, handle, sp, layer);

        this.registerPoint(
          id,
          sp,
          e => {
            this.editor.selectPointHandle(pt, name);
            // noop on down
          },
          (e, cursor) => {
            this.editor.nudgeHandle(
              pt.index,
              name,
              cursor.deltaDrag.x,
              cursor.deltaDrag.y
            );
          },
          e => {
            this.editor.commitFrame();
          }
        );
      }
    }

    let mainId = 'selectedPoint:' + pt.index.toString();
    let mp = this.editor.projection.posn(pt);

    // Main point
    this.drawPoint(mainId, pt, mp, layer);
    this.registerPoint(
      mainId,
      mp,
      e => {
        let newSelection = new Selection(this.editor.doc, [pt]);

        if (!this.editor.state.selection.equal(newSelection)) {
          this.editor.setSelection(newSelection);
        }
      },
      (e, cursor) => {
        this.editor.nudgeSelected(cursor.deltaDrag.x, cursor.deltaDrag.y);
      },
      e => {
        this.editor.commitFrame();
      }
    );
  }

  drawPoint(id, point, posn, layer) {
    let style = { stroke: consts.point, fill: 'white' };
    let radius = 2.5;
    if (this.editor.isSelected(point)) {
      //style.stroke = 'blue';
      radius = 3.5;
    } else if (this.editor.cursorHandler.isActive(id)) {
      //style.stroke = 'blue';
      radius = 3.5;
    }
    layer.drawCircle(posn, radius, style);
  }

  registerPoint(id, posn, onDown, onDrag, onDragStop) {
    let hitArea = new Circle(posn, 12);
    let elem = new Element(id, hitArea, {
      mousedown: (e, posn) => {
        e.stopPropagation();
        onDown(e, posn);
      },
      drag: (e, posn, lastPosn) => {
        e.stopPropagation();
        onDrag(e, posn, lastPosn);
      },
      'drag:start': e => {
        e.stopPropagation();
      },
      'drag:stop': e => {
        e.stopPropagation();
        onDragStop();
      }
    });

    this.editor.cursorHandler.registerElement(elem);
  }
}
