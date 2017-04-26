import shapes from 'lab/shapes';
import Tool from 'ui/tools/tool';
import Bounds from 'geometry/bounds'

export default class Cursor extends Tool {
  constructor(editor) {
    super(editor);

    this.dragSelectStart = null;
    this.dragSelectEnd = null;
  }

  handleMousemove(posn) {
    if (this.editor.canvas.cursor.dragging) {
      return;
    }

    delete this.editor.state.hovering;

    if (!this.editor.doc) return;
    if (!this.editor.canvas.cursor.currentPosn) return;

    let p = this.editor.projection.posnInvert(this.editor.canvas.cursor.currentPosn);

    let elems = this.editor.doc.elements.slice(0).reverse();

    for (let element of elems) {
      if (shapes.contains(element, p)) {
        this.editor.state.hovering = element;
        break;
      }
    }
  }

  handleMousedown(posn) {
    if (this.editor.state.hovering) {
      if (!this.editor.state.selection.has(this.editor.state.hovering)) {
        this.editor.state.selection = [this.editor.state.hovering];
      }
    }
  }

  handleClick(posn) {
    if (this.editor.state.hovering) {
      this.editor.state.selection = [this.editor.state.hovering];
      console.log(this.editor.state.hovering);
    } else {
      this.editor.state.selection = [];
    }
  }

  handleDragStart(posn) {
    if (this.editor.state.selection.length === 0) {
      this.dragSelectStart = posn;
    }
  }

  handleDrag(posn, lastPosn) {
    if (this.dragSelectStart) {
      this.dragSelectEnd = posn;
    } else {
      let xd = posn.x - lastPosn.x;
      let yd = posn.y - lastPosn.y;

      xd /= this.editor.state.zoomLevel;
      yd /= this.editor.state.zoomLevel;

      this.editor.nudgeSelected(xd, yd);
    }
  }

  handleDragStop(posn) {
    if (this.dragSelectStart) {
      let bounds = this.editor.projection.boundsInvert(
        Bounds.fromPosns(this.dragSelectStart, this.dragSelectEnd)
      );

      let newSelection = [];

      let elems = this.editor.doc.elements.slice(0).reverse();
      for (let elem of elems) {
        if (shapes.overlap(bounds, elem)) {
          newSelection.push(elem);
        }
      }

      this.editor.state.selection = newSelection;

      this.dragSelectStart = null;
      this.dragSelectEnd = null;
    }
  }

  refresh(layer, context) {
    let hovering = this.editor.state.hovering;

    if (this.dragSelectStart && this.dragSelectEnd) {
      let bounds = Bounds.fromPosns(this.dragSelectStart, this.dragSelectEnd);
      context.strokeStyle = 'black';
      context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    } else {

      let boundsList = [];

      for (let elem of this.editor.state.selection) {
        boundsList.push(elem.bounds());
      }

      let groupBounds = this.editor.projectionSharp.bounds(new Bounds(boundsList));

      // Draw transformer box
      layer.drawRect(groupBounds, { stroke: 'blue' });

      let tm = groupBounds.tm();
      let bm = groupBounds.bm();
      let rm = groupBounds.rm();
      let lm = groupBounds.lm();
      layer.drawRect(new Bounds(tm.x, tm.y, 4, 4), { stroke: 'blue', centerPosn: true });
      layer.drawRect(new Bounds(bm.x, bm.y, 4, 4), { stroke: 'blue', centerPosn: true });
      layer.drawRect(new Bounds(rm.x, rm.y, 4, 4), { stroke: 'blue', centerPosn: true });
      layer.drawRect(new Bounds(lm.x, lm.y, 4, 4), { stroke: 'blue', centerPosn: true });
    }

    /*

      let points = elem.points;
      if (points.segments) {
        for (let segment of points.segments) {
          for (let point of segment.points) {
            let x = this.editor.projection.xSharp(point.x);
            let y = this.editor.projection.ySharp(point.y);

            //context.fillStyle = 'white';
            context.strokeStyle = 'blue';
            //context.fillRect(this.editor.projection.x(point.x)-2, this.editor.projection.y(point.y)-1, 4, 4);
            context.strokeRect(x-2, y-2, 4, 4);

            if (point.x2) {
              context.strokeRect(this.editor.projection.xSharp(point.x2)-2, this.editor.projection.ySharp(point.y2)-2, 4, 4);
            }
            if (point.x3) {
              context.strokeRect(this.editor.projection.xSharp(point.x3)-2, this.editor.projection.ySharp(point.y3)-2, 4, 4);
            }
          }
        }
      }
    }
    */

    return;

    if (hovering) {
      let points = hovering.points;
      if (points.segments) {
        for (let segment of points.segments) {
          for (let point of segment.points) {
            point = this.editor.projectionSharp.posn(point);

            //context.fillStyle = 'white';
            context.strokeStyle = 'blue';
            //context.fillRect(this.editor.projection.x(point.x)-2, this.editor.projection.y(point.y)-1, 4, 4);
            context.strokeRect(point.x-2, point.y-2, 4, 4);

            if (point.x2) {
              context.strokeRect(this.editor.projectionSharp.x(point.x2)-2, this.editor.projectionSharp.y(point.y2)-2, 4, 4);
            }
            if (point.x3) {
              context.strokeRect(this.editor.projectionSharp.x(point.x3)-2, this.editor.projectionSharp.y(point.y3)-2, 4, 4);
            }

          }
        }
      }

      /*
      // DEBUG CODE
      let lss = hovering.lineSegments();
      let inited = false;
      context.beginPath();
      context.moveTo(this.editor.projection.x(lss[0].x), this.editor.projection.y(lss[0].y));
      //console.log(lss);
      for (let ls of lss) {
        //console.log(ls.source.prec, ls.source, ls.source.succ);
        if (ls.a && ls.b) {
          //console.log(ls.length);
          context.lineTo(this.editor.projection.xSharp(ls.b.x), this.editor.projection.ySharp(ls.b.y));
        } else {
          context.bezierCurveTo(
            this.editor.projection.xSharp(ls.p2.x),
            this.editor.projection.ySharp(ls.p2.y),
            this.editor.projection.xSharp(ls.p3.x),
            this.editor.projection.ySharp(ls.p3.y),
            this.editor.projection.xSharp(ls.p4.x),
            this.editor.projection.ySharp(ls.p4.y)
          );
        }
        context.strokeStyle = 'purple';
        context.stroke();
      }
      */
    }

  }
}
