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

    for (let name of ['sHandle', 'pHandle']) {
      let handle = pt[name];
      if (!handle) continue;

      let sp = this.editor.projection.posn(handle);
      let id = 'selectedPoint:'+i+':'+name;
      layer.drawLineSegment(mainPosn, sp);

      this.drawPoint(id, sp, layer);

      this.registerPoint(id, sp, (e) => {
        // noop on down
      }, (e, posn, lastPosn) => {
        let xd = posn.x - lastPosn.x;
        let yd = posn.y - lastPosn.y;
        pt.nudgeHandle(name, xd, yd);
        this.editor.canvas.refreshAll();
      });
    }

    let mainId = 'selectedPoint:'+i;
    let mp = this.editor.projection.posn(pt);

    // Main point
    this.drawPoint(mainId, mp, layer);
    this.registerPoint(mainId, mp, (e) => {
      if (!this.editor.state.selection.has(pt)) {
        this.editor.setSelection([pt]);
      }
    }, (e, posn, lastPosn) => {
      let xd = posn.x - lastPosn.x;
      let yd = posn.y - lastPosn.y;
      this.editor.nudgeSelected(xd, yd);
    });
  }

  drawPoint(id, posn, layer, onDrag) {
    let style = { stroke: consts.point, fill: consts.point };
    if (this.editor.cursorHandler.isActive(id)) {
      style.fill = 'red';
      style.stroke = 'red';
    }
    layer.drawCircle(posn, 2.5, style);
  }

  registerPoint(id, posn, onDown, onDrag) {
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
