import consts from 'consts';
import Circle from 'geometry/circle';
import Element from 'ui/element';
import UIElement from 'ui/editor/ui_element';
import Selection from 'ui/selection';
import { ELEMENTS, POINTS, PHANDLE, SHANDLE } from 'ui/selection';

import HistoryFrame from 'history/Frame';
import * as actions from 'history/actions/actions';

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

        // Draw all of the non-selected, non-hovered points
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

      // Draw hovered point
      if (tool.hovering && !this.editor.state.selection.has(tool.hovering)) {
        this.handlePoint(tool.hovering, layer);
      }
    }

    // Don't draw selected points when we're manipulating points
    if (tool.id === 'pen' && tool.closest) {
      return;
    }

    // Draw selected points
    if (this.editor.state.selection.isOfType([POINTS, PHANDLE, SHANDLE])) {
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

        if (handle) {
          // Handle exists; draw control for it

          let sp = this.editor.projection.posn(handle);
          let id = 'selectedPoint:' + pt.index.toString() + ':' + name;
          layer.drawLineSegment(mainPosn, sp, { stroke: consts.point });

          this.drawPoint(id, handle, sp, layer);

          this.registerPoint(
            id,
            sp,
            e => {
              this.editor.selectPointHandle(pt, name);
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
        } else {
          // Handle doesn't exist; create prompt for adding one
          let suggestedHandle;

          let other = name === 'pHandle' ? 'sHandle' : 'pHandle';
          let otherHandle = pt[other];

          if (otherHandle) {
            // Suggest reflection of the other handle
            suggestedHandle = otherHandle.reflect(pt);
          } else {
            let pLine = new LineSegment(pt, pt.prec);
            let sLine = new LineSegment(pt, pt.succ);
            let pAngle = pLine.angle360;
            let sAngle = sLine.angle360;

            if (sAngle < pAngle) sAngle += 360;

            let midAngle = pAngle + (sAngle - pAngle) / 2;

            let neighborD = Math.min(pLine.length, sLine.length);

            if (name === 'pHandle') {
              suggestedHandle = pt
                .clone()
                .nudge(neighborD / 2, 0)
                .rotate(midAngle + 180, pt);
            } else {
              suggestedHandle = pt
                .clone()
                .nudge(-neighborD / 2, 0)
                .rotate(midAngle + 180, pt);
            }
          }
          let suggestedProj = this.editor.projection.posn(suggestedHandle);

          this.registerSuggestedHandle(pt, suggestedHandle, name);

          layer.drawCircle(suggestedProj, 4, {
            stroke: name === 'sHandle' ? 'red' : 'green'
          });
        }
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
        if (e.shiftKey) {
          if (this.editor.state.selection.type === POINTS) {
            this.editor.toggleInSelection([pt]);
          } else {
            this.editor.setSelection(newSelection);
          }
        } else {
          if (!this.editor.state.selection.equal(newSelection)) {
            this.editor.setSelection(newSelection);
          }
        }
      },
      (e, cursor) => {
        this.editor.nudgeSelected(cursor.deltaDrag.x, cursor.deltaDrag.y);
      },
      e => {
        console.log('commit');
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

  registerSuggestedHandle(pt, suggestion, which) {
    let stageAddition = posn => {
      this.editor.stageFrame(
        new HistoryFrame(
          [
            new actions.AddHandleAction({
              index: pt.index,
              handle: which,
              posn,
              reflect: false
            })
          ],
          'Add handle'
        )
      );
    };

    let id = 'selectedPoint:' + pt.index.toString() + ':suggestion:' + which;

    let elem = new Element(
      id,
      new Circle(this.editor.projection.posn(suggestion), 12),
      {
        mousedown: (e, posn) => {
          stageAddition(suggestion);
          e.stopPropagation();
        },
        drag: (e, cursor) => {
          stageAddition(cursor.posnCurrent);
          e.stopPropagation();
        },
        'drag:start': e => {
          e.stopPropagation();
        },
        mouseup: e => {
          this.editor.commitFrame();
        }
      }
    );

    this.editor.cursorHandler.registerElement(elem);
  }
}
