export default class Tool {
  constructor(editor) {
    this.editor = editor;
  }

  handleMousemove(e, posn) {

  }

  handleMousedown(e, posn) {
  }

  handleClick(e, posn) {
  }

  handleDragStart(e, posn) {
  }

  handleDrag(e, posn) {
  }

  handleDragStop(e, posn) {
  }

  refresh(layer, context) {

  }
}

    // Draw any needed UI elements
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

    let hovering = null;
    if (hovering && !this.editor.state.selection.has(hovering)) {
      let points = hovering.points;
      let i = 0;
      if (points.segments) {
        for (let segment of points.segments) {
          for (let pt of segment.points) {
            let point = this.editor.projection.posn(pt).sharp();

            layer.drawCircle(point, 2.5, { stroke: 'black', fill: 'white' });

            if (point.x2) {
              context.strokeRect(this.editor.projection.x(point.x2)-2, this.editor.projection.y(point.y2)-2, 4, 4);
            }
            if (point.x3) {
              context.strokeRect(this.editor.projection.x(point.x3)-2, this.editor.projection.y(point.y3)-2, 4, 4);
            }
          }
        }
      }
  */
      /*

      // DEBUG CODE
      let lss = hovering.lineSegments();

      for (let ls of lss) {
        context.beginPath();
        layer.moveTo(this.editor.projection.posn(ls.p1));
        layer.drawLine(this.editor.projection.line(ls));

        context.strokeStyle = 'black';
        context.lineWidth = 1;
        context.stroke();
      }
    }
      */
