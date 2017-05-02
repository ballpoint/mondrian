import shapes from 'lab/shapes';
import Tool from 'ui/tools/tool';
import Bounds from 'geometry/bounds';

export default class Cursor extends Tool {
  constructor(editor) {
    super(editor);

    this.hovering = null;
    this.dragSelectStart = null;
    this.dragSelectEnd = null;
  }

  handleMousemove(e, posn) {
    if (this.editor.canvas.cursor.dragging) {
      return;
    }

    delete this.hovering;

    if (!this.editor.doc) return;

    let elems = this.editor.doc.elements.slice(0).reverse();

    for (let element of elems) {
      if (shapes.contains(element, posn)) {
        this.hovering = element;
        break;
      }
    }
  }

  handleMousedown(e, posn) {
    if (this.hovering) {
      if (!this.editor.state.selection.has(this.hovering)) {
        this.editor.state.selection = [this.hovering];
      }
    } else {
        this.editor.state.selection = [];
    }
  }

  handleClick(e, posn) {
    if (this.hovering) {
      this.editor.state.selection = [this.hovering];
    } else {
      this.editor.state.selection = [];
    }
  }

  handleDragStart(e, posn) {
    if (this.editor.state.selection.length === 0) {
      this.dragSelectStart = posn;
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
      let bounds = Bounds.fromPosns(this.dragSelectStart, this.dragSelectEnd)

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
    let hovering = this.hovering;

    if (this.dragSelectStart && this.dragSelectEnd) {
      let bounds = Bounds.fromPosns(this.dragSelectStart, this.dragSelectEnd);
      bounds = this.editor.projection.bounds(bounds);
      context.strokeStyle = 'black';
      context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
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
            point = this.editor.projection.posn(point);

            //context.fillStyle = 'white';
            context.strokeStyle = 'blue';
            //context.fillRect(this.editor.projection.x(point.x)-2, this.editor.projection.y(point.y)-1, 4, 4);
            context.strokeRect(point.x-2, point.y-2, 4, 4);

            if (point.x2) {
              context.strokeRect(this.editor.projection.x(point.x2)-2, this.editor.projection.y(point.y2)-2, 4, 4);
            }
            if (point.x3) {
              context.strokeRect(this.editor.projection.x(point.x3)-2, this.editor.projection.y(point.y3)-2, 4, 4);
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
