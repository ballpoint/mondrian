import consts from 'consts';
import shapes from 'lab/shapes';
import Tool from 'ui/tools/tool';
import Bounds from 'geometry/bounds';
import {
  MoveTo,
  LineTo,
  HorizTo,
  VertiTo,
  CurveTo,
} from 'geometry/point';


export default class SubCursor extends Tool {
  constructor(editor) {
    super(editor);
  }

  handleMousemove(e, posn) {
    this.nearPoints = [];

    let closestPoint;
    let closestD;

    for (let elem of this.editor.doc.elements) {
      // TODO optimization using elem bounds to totally ignore it
      // if we're nowhere near it
      for (let pt of elem.points.all()) {
        let d = this.editor.projection.z(pt.distanceFrom(posn));
        if (d < 200) {
          this.nearPoints.push(pt);

          if (d < 8) {
            if (!closestPoint || (d < closestD)) {
              closestPoint = pt;
              closestD     = d;
            }
          }
        }
      }
    }

    this.hovering = closestPoint;
  }

  handleMousedown(e, posn) {
    if (this.hovering) {
      if (!this.editor.state.selection.has(this.hovering)) {
        this.editor.setSelection([this.hovering]);
      }
    } else {
      this.editor.setSelection([]);
    }
  }

  handleClick(e, posn) {
  }

  handleDragStart(e, posn, lastPosn) {
    if (this.editor.state.selection.length === 0) {
      this.dragSelectStart = lastPosn;
    }
  }

  handleDrag(e, posn, lastPosn) {
    if (this.dragSelectStart) {
      this.dragSelectEnd = posn;
    } else {
      let xd = posn.x - lastPosn.x;
      let yd = posn.y - lastPosn.y;

      this.editor.nudgeSelected(xd, yd);
    }
  }

  handleDragStop(e, posn) {
    if (this.dragSelectStart) {
      let bounds = Bounds.fromPosns([this.dragSelectStart, this.dragSelectEnd])

      let newSelection = [];

      let elems = this.editor.doc.elements.slice(0).reverse();
      for (let elem of elems) {
        for (let pt of elem.points.all()) {
          if (shapes.contains(bounds, pt)) {
            newSelection.push(pt);
          }
        }
      }

      this.editor.setSelection(newSelection);

      console.log(newSelection);

      this.dragSelectStart = null;
      this.dragSelectEnd = null;
    }
  }

  refresh(layer, context) {
    if (this.dragSelectStart && this.dragSelectEnd) {
      let bounds = Bounds.fromPosns([this.dragSelectStart, this.dragSelectEnd]);
      bounds = this.editor.projection.bounds(bounds).sharp();
      layer.setLineWidth(1);
      layer.drawRect(bounds, { stroke: 'black' });
    } else {

      if (this.editor.state.selectionType === 'POINTS') {
        for (let pt of this.editor.state.selection) {
          this.drawSelectedPoint(layer, pt);
        }
      }

      if (this.nearPoints) {
        for (let pt of this.nearPoints) {
          if (!this.editor.state.selection.has(pt)) {
            if (pt === this.hovering) {
              layer.drawCircle(this.editor.projection.posn(pt), 2.5, { stroke: 'blue', fill: 'blue' });
            } else {
              layer.drawCircle(this.editor.projection.posn(pt), 2.5, { stroke: 'black', fill: 'white' });
            }
          }
        }
      }
    }
  }

  drawSelectedPoint(layer, pt) {
    let pm = this.editor.projection.posn(pt);
    layer.drawCircle(pm, 2.5, { stroke: consts.point, fill: consts.point });

    if (pt instanceof CurveTo) {
      let p3 = this.editor.projection.posn(pt.p3());

      layer.drawCircle(p3, 2.5, { stroke: consts.point, fill: consts.point });
      layer.drawLineSegment(pm, p3, { stroke: consts.point });
    }

    let p2;
    if (pt.succ instanceof CurveTo) {
      p2 = this.editor.projection.posn(pt.succ.p2());
    }

    if (p2) {
      layer.drawCircle(p2, 2.5, { stroke: consts.point, fill: consts.point });
      layer.drawLineSegment(pm, p2, { stroke: consts.point });
    }
  }

}
