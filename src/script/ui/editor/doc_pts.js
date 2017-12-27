import consts from 'consts';
import Circle from 'geometry/circle';
import LineSegment from 'geometry/line-segment';
import Element from 'ui/element';
import UIElement from 'ui/editor/ui_element';
import Selection from 'ui/selection';
import { ELEMENTS, POINTS, PHANDLE, SHANDLE } from 'ui/selection';

import HistoryFrame from 'history/Frame';
import * as actions from 'history/actions/actions';

import snapping from 'lib/snapping';
import { degs_45_90 } from 'lib/snapping';

export default class DocumentPointsUIElement extends UIElement {
  reset() {
    this.editor.cursorHandler.unregisterElement(/selectedPoint.*/);
  }

  _refresh(layer, context) {
    this.reset();
    if (!this.editor.doc) return;

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
                fill: consts.white
              });
            }
          }
        }
      }

      // Draw hovered point
      if (
        tool.hovering &&
        !this.editor.state.selection.has(tool.hovering)
      ) {
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
      for (let which of ['sHandle', 'pHandle']) {
        let handle = pt[which];

        if (handle) {
          // Handle exists; draw control for it

          let sp = this.editor.projection.posn(handle);
          let id = 'selectedPoint:' + pt.index.toString() + ':' + which;
          layer.drawLineSegment(mainPosn, sp, { stroke: consts.point });

          this.drawPoint(id, handle, sp, layer);

          this.registerPoint(
            id,
            sp,
            e => {
              this.editor.selectPointHandle(pt, which);
            },
            (e, cursor) => {
              this.editor.nudgeHandle(
                pt.index,
                which,
                cursor.deltaDrag.x,
                cursor.deltaDrag.y
              );
            },
            e => {
              this.editor.commitFrame();
            }
          );
        } else {
          this.drawSuggestedHandle(layer, pt, which);
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
        let posn = cursor.posnCurrent;
        if (e.shiftKey) {
          posn = snapping.toDegs(cursor.posnDown, posn, degs_45_90);
        }
        let delta = posn.delta(cursor.posnDown);
        this.editor.nudgeSelected(delta.x, delta.y);
      },
      e => {
        this.editor.commitFrame();
      }
    );
  }

  drawPoint(id, point, posn, layer) {
    let style = { stroke: consts.point, fill: consts.white };
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

  drawSuggestedHandle(layer, pt, which) {
    // Handle doesn't exist; create prompt for adding one
    let suggestion;
    let ptProj = this.editor.projection.posn(pt);

    let other = which === 'pHandle' ? 'sHandle' : 'pHandle';
    let otherHandle = pt[other];

    if (otherHandle) {
      // Suggest reflection of the other handle
      suggestion = otherHandle.reflect(pt);
    } else {
      if (pt.prec && pt.succ) {
        let pLine = new LineSegment(pt, pt.prec);
        let sLine = new LineSegment(pt, pt.succ);
        let pAngle = pLine.angle360;
        let sAngle = sLine.angle360;

        if (sAngle < pAngle) sAngle += 360;

        let midAngle = pAngle + (sAngle - pAngle) / 2;

        let neighborD = Math.min(pLine.length, sLine.length);

        if (which === 'pHandle') {
          suggestion = pt
            .clone()
            .nudge(neighborD / 2, 0)
            .rotate(midAngle + 180, pt);
        } else {
          suggestion = pt
            .clone()
            .nudge(-neighborD / 2, 0)
            .rotate(midAngle + 180, pt);
        }
      }
    }

    if (!suggestion) return;

    let id = 'selectedPoint:' + pt.index.toString() + ':suggestion:' + which;

    let isActive = this.editor.cursorHandler.isActive(id);
    let suggestedProj = this.editor.projection.posn(suggestion);

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

    let elem = new Element(id, new Circle(suggestedProj, 12), {
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
        this.editor.selectPointHandle(pt, which);
      }
    });

    this.editor.cursorHandler.registerElement(elem);

    if (isActive) {
      // Dotted line
      layer.drawLineSegment(ptProj, suggestedProj, {
        stroke: consts.blue
      });

      const plusSignDimens = 4;

      // Draw plus sign
      let ls = new LineSegment(ptProj, suggestedProj);
      let a = ls.angle360;
      let pp = ptProj
        .clone()
        .nudge(0, -ls.length - 14)
        .rotate(a, ptProj);

      layer.drawLineSegment(
        pp.clone().nudge(-plusSignDimens, 0),
        pp.clone().nudge(plusSignDimens, 0),
        {
          stroke: consts.blue
        }
      );
      layer.drawLineSegment(
        pp.clone().nudge(0, -plusSignDimens),
        pp.clone().nudge(0, plusSignDimens),
        {
          stroke: consts.blue
        }
      );
    }

    let radius = isActive ? 4.5 : 2.5;
    let stroke = isActive ? consts.blue : consts.lightBlue;

    layer.drawCircle(suggestedProj, radius, {
      stroke,
      fill: consts.white
    });
  }
}
