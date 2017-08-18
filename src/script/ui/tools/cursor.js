import consts from 'consts';
import shapes from 'lab/shapes';
import Tool from 'ui/tools/tool';
import Bounds from 'geometry/bounds';
import Circle from 'geometry/circle';
import Posn from 'geometry/posn';

export default class Cursor extends Tool {
  constructor(editor) {
    super(editor);

    this.dragSelectStart = null;
    this.dragSelectEnd = null;
    this.hovering = [];

    this.skipClick = 0;
  }

  get id() {
    return 'cursor';
  }

  handleMousemove(e, cursor) {
    if (cursor.dragging) return;
    if (this.dragSelectStart) return;
    if (!this.editor.doc) return;

    let posn = cursor.posnCurrent;

    let z3 = this.editor.projection.zInvert(3);
    let posnPadded = Bounds.centeredOnPosn(posn, z3, z3);

    let elems = this.editor.doc.elementsAvailable.reverse();

    this.skipClick = 0;
    this.hovering = [];

    // TODO use bsearch tree here 8)
    for (let elem of elems) {
      let bp = elem.bounds().padded(z3);

      if (bp.contains(posn)) {
        if (shapes.contains(elem, posn)) {
          this.hovering.push(elem);
        } else if (shapes.overlap(elem, posnPadded)) {
          this.hovering.push(elem);
        }
      }
    }

    if (this.hovering.length > 0) {
      this.editor.setHovering([this.hovering[0]]);
    } else {
      this.editor.setHovering([]);
    }
  }

  handleMousedown(e, cursor) {
    delete this.annotation;
    let posn = cursor.posnCurrent;
    let selected;

    if (this.hovering.length > 0) {
      let skipClick = this.skipClick % this.hovering.length;

      if (this.hovering.length > skipClick) {
        selected = this.hovering[skipClick];
      } else {
        selected = this.hovering.last();
      }
    }

    if (selected) {
      if (!this.editor.isSelected(selected)) {
        this.editor.setSelection([selected]);
      }
    } else {
      this.editor.setSelection([]);
    }
  }

  handleClick(e, cursor) {
    this.skipClick++;
  }

  handleDragStart(e, cursor) {
    if (this.editor.state.selection.length === 0) {
      this.dragSelectStart = cursor.posnDown;
    }
  }

  handleDrag(e, cursor) {
    delete this.annotation;
    let posn = this.posnForDrag(e, cursor);

    let delta = posn.delta(cursor.posnDown);

    if (this.dragSelectStart) {
      this.dragSelectEnd = cursor.posnCurrent;
    } else if (this.editor.state.selection.length > 0) {
      this.editor.nudgeSelected(delta.x, delta.y);
    }
  }

  handleDragStop(e, cursor) {
    let posn = cursor.posnCurrent;

    if (this.dragSelectStart) {
      let bounds = Bounds.fromPosns([this.dragSelectStart, this.dragSelectEnd]);

      let newSelection = [];

      let elems = this.editor.doc.elementsAvailable.reverse();
      for (let elem of elems) {
        if (shapes.overlap(bounds, elem)) {
          newSelection.push(elem);
        }
      }

      this.editor.setSelection(newSelection);

      this.dragSelectStart = null;
      this.dragSelectEnd = null;
    } else {
      // Commit ongoing nudge
      this.editor.doc.history.commitFrame();
    }
  }

  refresh(layer, context) {
    if (this.dragSelectStart && this.dragSelectEnd) {
      let bounds = Bounds.fromPosns([this.dragSelectStart, this.dragSelectEnd]);
      bounds = this.editor.projection.bounds(bounds).sharp();
      layer.setLineWidth(1);
      layer.drawRect(bounds, { stroke: 'black' });
    }

    let ann = this.annotation;

    if (ann) {
      switch (ann.type) {
        case 'line':
          let sb = this.editor.state.selectionBounds.bounds;
          let center = this.editor.projection.posn(sb.center());
          let centerDown = this.editor.projection.posn(
            sb.center().nudge(-ann.delta.x, -ann.delta.y)
          );

          layer.drawLineSegment(center, centerDown, {
            stroke: consts.blue
          });
      }
    }
  }

  posnForDrag(e, cursor) {
    let posn = cursor.posnCurrent;

    if (e.shiftKey) {
      // Snap to 45 deg
      let a = posn.angle360(cursor.posnDown);

      for (let as = 0; as < 360; as += 45) {
        let min = as - 45 / 2;
        let max = as + 45 / 2;

        let matches = false;
        if (min < 0 && a >= 360 - 45) {
          matches = a - 360 > min && a - 360 < max;
        } else {
          matches = a > min && a < max;
        }

        if (matches) {
          // Found the correct snapping angle
          switch (as) {
            case 0:
            case 180:
              posn.x = cursor.posnDown.x;
              break;
            case 90:
            case 270:
              posn.y = cursor.posnDown.y;
              break;
            default:
              let d = posn.distanceFrom(cursor.posnDown);
              let xp = cursor.posnDown
                .clone()
                .nudge(0, -d * 2)
                .rotate(as, cursor.posnDown);
              let xls = new LineSegment(cursor.posnDown, xp);
              posn = xls.closestPosn(posn);
          }

          let delta = posn.delta(cursor.posnDown);

          this.annotation = {
            type: 'line',
            delta
          };

          return posn;

          break;
        }
      }
    }

    return posn;
  }
}
