import consts from 'consts';
import Circle from 'geometry/circle';
import Element from 'ui/element';
import UIElement from 'ui/editor/ui_element';
import {
  CurveTo,
} from 'geometry/point';


export default class SelectedPtsUIElement extends UIElement {
  reset() {
    this.editor.cursorHandler.unregisterElement(/selectedPoint.*/);    
  }

  _refresh(layer, context) {
    this.reset();

    let tool = this.editor.state.tool;

    if (tool.id === 'subcursor') {
      for (let elem of this.editor.doc.elements) {
        let points = elem.points.all();
        for (let i = 0; i < points.length; i ++) {
          let pt = points[i];
          if (!this.editor.state.selection.has(pt)) {
            if (pt !== tool.hovering) {
              layer.drawCircle(this.editor.projection.posn(pt), 2.5, { stroke: consts.point, fill: 'white' });
            }
          }
        }
      }

      if (tool.hovering && this.editor.state.selection.indexOf(tool.hovering)) {
        this.handlePoint(tool.hovering, 'h', layer);
      }
    }

    if (this.editor.state.selectionType === 'POINTS') {
      // draw selected pts
      for (let i = 0; i < this.editor.state.selection.length; i ++) {
        let pt = this.editor.state.selection[i];
        this.handlePoint(pt, i, layer);
      }
    }
  }

  handlePoint(pt, i, layer) {
    let mainPosn = this.editor.projection.posn(pt);

    if (pt instanceof CurveTo) {
      let p3 = pt.p3();
      let p3id = 'selectedPoint:'+i+':p3';

      layer.drawLineSegment(mainPosn, this.editor.projection.posn(p3), { stroke: consts.point });

      this.drawPoint(p3id, p3, layer, (e, posn, lastPosn) => {
        let xd = posn.x - lastPosn.x;
        let yd = posn.y - lastPosn.y;
        pt.absorb(p3.nudge(xd, yd), 3);
        this.editor.canvas.refreshAll();
      });

      this.registerPoint(p3id, p3, (e) => {
        // noop on down
      }, (e, posn, lastPosn) => {
        let xd = posn.x - lastPosn.x;
        let yd = posn.y - lastPosn.y;
        pt.nudge(xd, yd, 3);
      });
    }

    let p2;
    if (pt.succ instanceof CurveTo) {
      p2 = pt.succ.p2();
    }

    if (p2) {
      layer.drawLineSegment(mainPosn, this.editor.projection.posn(p2), { stroke: consts.point });

      let p2id = 'selectedPoint:'+i+':p2';

      this.drawPoint(p2id, p2, layer, (e, posn, lastPosn) => {
        let xd = posn.x - lastPosn.x;
        let yd = posn.y - lastPosn.y;
        pt.succ.absorb(p2.nudge(xd, yd), 2);
        this.editor.canvas.refreshAll();
      });

      this.registerPoint(p2id, p2, (e) => {
        // noop on down
      }, (e, posn, lastPosn) => {
        let xd = posn.x - lastPosn.x;
        let yd = posn.y - lastPosn.y;
        pt.nudge(xd, yd, 2);
      });
    }

    let mainId = 'selectedPoint:'+i;

    // Main point
    this.drawPoint(mainId, pt, layer);
    this.registerPoint(mainId, pt, (e) => {
      if (!this.editor.state.selection.has(pt)) {
        this.editor.setSelection([pt]);
      }
    }, (e, posn, lastPosn) => {
      let xd = posn.x - lastPosn.x;
      let yd = posn.y - lastPosn.y;
      this.editor.nudgeSelected(xd, yd);
    });
  }

  drawPoint(id, pt, layer, onDrag) {
    let posn = this.editor.projection.posn(pt);
    let style = { stroke: consts.point, fill: consts.point };
    if (this.editor.cursorHandler.isActive(id)) {
      style.fill = 'red';
      style.stroke = 'red';
    }
    layer.drawCircle(posn, 2.5, style);
  }

  registerPoint(id, pt, onDown, onDrag) {
    let posn = this.editor.projection.posn(pt);

    let hitArea = new Circle(posn, 10);
    let elem = new Element(id, hitArea, {
      'mousedown': (e, posn) => {
        e.stopPropagation();
        onDown(e, posn);
      },
      'drag': (e, posn, lastPosn) => {
        e.stopPropagation();
        onDrag(e, posn, lastPosn);
      },
      'drag:start': (e) => { e.stopPropagation() },
      'drag:stop':  (e) => { e.stopPropagation() },
    });

    this.editor.cursorHandler.registerElement(elem);
  }

};
