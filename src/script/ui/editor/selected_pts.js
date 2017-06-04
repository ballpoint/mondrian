import consts from 'consts';
import Circle from 'geometry/circle';
import Element from 'ui/element';
import UIElement from 'ui/editor/ui_element';
import {
  CurveTo,
} from 'geometry/point';


export default class SelectedPtsUIElement extends UIElement {
  reset() {
    
  }

  _refresh(layer, context) {
    this.reset();

    /*
    if (this.editor.state.selectionType === 'POINTS') {
      for (let pt of this.editor.state.selection) {
        this.drawSelectedPoint(layer, pt);
      }
    }
    */
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

      if (this.editor.state.selectionType === 'POINTS') {
        // draw selected pts
        for (let i = 0; i < this.editor.state.selection.length; i ++) {
          let pt = this.editor.state.selection[i];
          this.handlePoint(pt, i, layer);
        }
      }


      if (tool.hovering && this.editor.state.selection.indexOf(tool.hovering)) {
        this.handlePoint(tool.hovering, 'h', layer);
      }

    }
  }

  handlePoint(pt, i, layer) {
    let mainPosn = this.editor.projection.posn(pt);

    this.drawPoint('selectedPoint:'+i, pt, layer, (e, posn, lastPosn) => {
      let xd = posn.x - lastPosn.x;
      let yd = posn.y - lastPosn.y;
      this.editor.nudgeSelected(xd, yd);
    });

    if (pt instanceof CurveTo) {
      let p3 = pt.p3();

      this.drawPoint('selectedPoint:'+i+':p3', p3, layer, (e, posn, lastPosn) => {
        let xd = posn.x - lastPosn.x;
        let yd = posn.y - lastPosn.y;
        pt.absorb(p3.nudge(xd, yd), 3);
        this.editor.canvas.refreshAll();
      });
      layer.drawLineSegment(mainPosn, this.editor.projection.posn(p3), { stroke: consts.point });
    }

    let p2;
    if (pt.succ instanceof CurveTo) {
      p2 = pt.succ.p2();
    }

    if (p2) {
      this.drawPoint('selectedPoint:'+i+':p2', p2, layer, (e, posn, lastPosn) => {
        let xd = posn.x - lastPosn.x;
        let yd = posn.y - lastPosn.y;
        pt.succ.absorb(p2.nudge(xd, yd), 2);
        this.editor.canvas.refreshAll();
      });
      layer.drawLineSegment(mainPosn, this.editor.projection.posn(p2), { stroke: consts.point });
    }

  }

  drawPoint(id, pt, layer, onDrag) {
    let posn = this.editor.projection.posn(pt);
    let style = { stroke: consts.point, fill: consts.point };
    if (this.editor.cursorHandler.isActive(id)) {
      style.fill = 'red';
      style.stroke = 'red';
    }
    layer.drawCircle(posn, 2.5, style);

    let hitArea = new Circle(posn, 10);

    let elem = new Element(id, hitArea, {
      'mousedown': (e) => {
        e.stopPropagation();

        /*
        if (!this.editor.state.selection.has(pt)) {
          this.editor.setSelection([pt]);
        }
        */
      },
      'drag': (e, posn, lastPosn) => {
        e.stopPropagation();
        onDrag(e, posn, lastPosn);
      },
      'drag:start': (e) => { e.stopPropagation() },
      'drag:stop': (e) => { e.stopPropagation() },
    });

    this.editor.cursorHandler.registerElement(elem);


  }

};
