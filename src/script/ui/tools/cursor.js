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
    delete this.editor.state.hovering;

    if (!this.editor.doc) return;
    if (!this.editor.canvas.cursor.currentPosn) return;

    let docPosn = this.editor.docPosn(this.editor.canvas.cursor.currentPosn);

    let elems = this.editor.doc.elements.slice(0).reverse();

    for (let element of elems) {
      if (shapes.contains(element, docPosn)) {
        this.editor.state.hovering = element;
        break;
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
    if (this.editor.state.hovering) {
      this.editor.state.selection = [this.editor.state.hovering];
    } else {
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
      let bounds = Bounds.fromPosns(
        this.editor.docPosn(this.dragSelectStart),
        this.editor.docPosn(this.dragSelectEnd)
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
      let xMin = Math.min(this.dragSelectStart.x, this.dragSelectEnd.x);
      let yMin = Math.min(this.dragSelectStart.y, this.dragSelectEnd.y);
      let w = Math.abs(this.dragSelectStart.x - this.dragSelectEnd.x);
      let h = Math.abs(this.dragSelectStart.y - this.dragSelectEnd.y);

      context.strokeStyle = 'blue';
      context.strokeRect(xMin, yMin, w, h);
    }

    for (let elem of this.editor.state.selection) {

      let bounds = elem.bounds();

      context.strokeStyle = 'blue';
      context.strokeRect(
        this.editor.xSharp(bounds.x),
        this.editor.ySharp(bounds.y),
        this.editor.zScale(bounds.width),
        this.editor.zScale(bounds.height)
      );


      let points = elem.points;
      if (points.segments) {
        for (let segment of points.segments) {
          for (let point of segment.points) {
            let x = this.editor.xSharp(point.x);
            let y = this.editor.ySharp(point.y);

            //context.fillStyle = 'white';
            context.strokeStyle = 'blue';
            //context.fillRect(this.editor.x(point.x)-2, this.editor.y(point.y)-1, 4, 4);
            context.strokeRect(x-2, y-2, 4, 4);

            if (point.x2) {
              context.strokeRect(this.editor.xSharp(point.x2)-2, this.editor.ySharp(point.y2)-2, 4, 4);
            }
            if (point.x3) {
              context.strokeRect(this.editor.xSharp(point.x3)-2, this.editor.ySharp(point.y3)-2, 4, 4);
            }
          }
        }
      }
    }

    if (hovering) {
      let points = hovering.points;
      if (points.segments) {
        for (let segment of points.segments) {
          for (let point of segment.points) {
            let x = this.editor.xSharp(point.x);
            let y = this.editor.ySharp(point.y);

            //context.fillStyle = 'white';
            context.strokeStyle = 'blue';
            //context.fillRect(this.editor.x(point.x)-2, this.editor.y(point.y)-1, 4, 4);
            context.strokeRect(x-2, y-2, 4, 4);

            if (point.x2) {
              context.strokeRect(this.editor.xSharp(point.x2)-2, this.editor.ySharp(point.y2)-2, 4, 4);
            }
            if (point.x3) {
              context.strokeRect(this.editor.xSharp(point.x3)-2, this.editor.ySharp(point.y3)-2, 4, 4);
            }

          }
        }
      }
    }

  }
}
