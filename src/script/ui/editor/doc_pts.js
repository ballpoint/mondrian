import consts from 'consts';
import Circle from 'geometry/circle';
import Element from 'ui/element';
import UIElement from 'ui/editor/ui_element';


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
        this.handlePoint(pt, i, layer, {
          includeHandles: true
        });
      }
    }
  }

  handlePoint(pt, i, layer, opts={}) {
    let mainPosn = this.editor.projection.posn(pt);

    if (opts.includeHandles) {
      for (let name of ['sHandle', 'pHandle']) {
        let handle = pt[name];
        if (!handle) continue;

        let sp = this.editor.projection.posn(handle);
        let id = 'selectedPoint:'+i+':'+name;
        layer.drawLineSegment(mainPosn, sp);

        this.drawPoint(id, handle, sp, layer);

        this.registerPoint(id, sp, (e) => {
          // noop on down
        }, (e, posn, lastPosn) => {
          let xd = posn.x - lastPosn.x;
          let yd = posn.y - lastPosn.y;
          this.editor.nudgeHandle(name, xd, yd);
        });
      }
    }

    let mainId = 'selectedPoint:'+i;
    let mp = this.editor.projection.posn(pt);

    // Main point
    this.drawPoint(mainId, pt, mp, layer);
    this.registerPoint(mainId, mp, (e) => {
      console.log(pt);
      if (!this.editor.state.selection.has(pt)) {
        this.editor.setSelection([pt]);
      }
    }, (e, posn, lastPosn) => {
      let xd = posn.x - lastPosn.x;
      let yd = posn.y - lastPosn.y;
      this.editor.nudgeSelected(xd, yd);
    });
  }

  drawPoint(id, point, posn, layer, onDrag) {
    let style = { stroke: consts.point, fill: 'white' };
    let radius = 2.5;
    if (this.editor.isSelected(point)) {
      style.stroke = 'blue';
      radius = 3.5;
    } else if (this.editor.cursorHandler.isActive(id)) {
      style.stroke = 'blue';
      radius = 3.5;
    }
    layer.drawCircle(posn, radius, style);
  }

  registerPoint(id, posn, onDown, onDrag) {
    let hitArea = new Circle(posn, 12);
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
