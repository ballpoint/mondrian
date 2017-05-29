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
    if (this.editor.cursor.dragging) {
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
        this.editor.selectElements([this.hovering]);
      }
    } else {
      this.editor.selectElements([]);
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

  handleDragStop(e, posn, startPosn) {
    if (this.dragSelectStart) {
      let bounds = Bounds.fromPosns(this.dragSelectStart, this.dragSelectEnd)

      let newSelection = [];

      let elems = this.editor.doc.elements.slice(0).reverse();
      for (let elem of elems) {
        if (shapes.overlap(bounds, elem)) {
          newSelection.push(elem);
        }
      }

      this.editor.selectElements(newSelection);

      this.dragSelectStart = null;
      this.dragSelectEnd = null;
    }
  }

  refresh(layer, context) {
    let hovering = this.hovering;

    if (this.dragSelectStart && this.dragSelectEnd) {
      let bounds = Bounds.fromPosns(this.dragSelectStart, this.dragSelectEnd);
      bounds = this.editor.projection.bounds(bounds).sharp();
      layer.setLineWidth(1);
      layer.drawRect(bounds, { stroke: 'black' });
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


    if (hovering && !this.editor.state.selection.has(hovering)) {
      let points = hovering.points;
      let i = 0;
      if (points.segments) {
        for (let segment of points.segments) {
          for (let pt of segment.points) {
            let point = this.editor.projection.posn(pt);

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

      // DEBUG CODE
      let lss = hovering.lineSegments();

      for (let ls of lss) {
        context.beginPath();
        layer.moveTo(this.editor.projection.posn(ls.p1));
        layer.drawLine(this.editor.projection.line(ls));

        context.strokeStyle = 'purple';
        context.strokeWidth = 2;
        context.stroke();
      }
    }
  }
}
