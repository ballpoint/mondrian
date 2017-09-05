import consts from 'consts';
import shapes from 'lab/shapes';
import Tool from 'ui/tools/tool';
import Bounds from 'geometry/bounds';

export default class SubCursor extends Tool {
  constructor(editor) {
    super(editor);
  }

  get id() {
    return 'subcursor';
  }

  handleMousemove(e, cursor) {
    let posn = cursor.posnCurrent;
    if (this.dragSelectStart) return;

    let pointsToCheck = [];

    let closestPoint;
    let closestD;

    let skipped = 0;
    let checked = 0;

    for (let elem of this.editor.doc.elementsFlat) {
      // Make sure we're anywhere near this element before we spend time iterating
      // through all of its points
      let bounds = elem.bounds().padded(10);
      if (shapes.contains(bounds, posn)) {
        let points = elem.getPoints();
        window.$p = points;
        pointsToCheck = pointsToCheck.concat(points);
      }
    }

    for (let pt of pointsToCheck) {
      let d = this.editor.projection.z(pt.distanceFrom(posn));
      if (d < 8) {
        if (!closestPoint || d < closestD) {
          closestPoint = pt;
          closestD = d;
        }
      }
    }

    this.hovering = closestPoint;
  }

  handleMousedown(e, cursor) {
    if (!this.hovering) {
      this.editor.setSelection([]);
    }
  }

  handleMouseup(e, cursor) {}

  handleClick(e, cursor) {}

  handleDragStart(e, cursor) {
    this.dragSelectStart = cursor.posnDown;
  }

  handleDrag(e, cursor) {
    if (this.dragSelectStart) {
      this.dragSelectEnd = cursor.posnCurrent;
    }
  }

  handleDragStop(e, cursor) {
    if (this.dragSelectStart) {
      let bounds = Bounds.fromPosns([this.dragSelectStart, this.dragSelectEnd]);

      let newSelection = [];

      let elems = this.editor.doc.elementsFlat.slice(0).reverse();
      for (let elem of elems) {
        for (let pt of elem.getPoints()) {
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
    }
  }
}
