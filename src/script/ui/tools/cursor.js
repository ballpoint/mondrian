import consts from 'consts';
import shapes from 'lab/shapes';
import Tool from 'ui/tools/tool';

import Posn from 'geometry/posn';
import Bounds from 'geometry/bounds';
import Circle from 'geometry/circle';
import Text from 'geometry/text';

import HistoryFrame from 'history/Frame';
import * as actions from 'history/actions/actions';

import snapping from 'lib/snapping';
import { degs_45_90 } from 'lib/snapping';

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

    let z3 = this.editor.projection.zInvert(3);
    let posn = cursor.posnCurrent;
    let posnPadded = Bounds.centeredOnPosn(posn, z3, z3);

    let elems = this.editor.doc.elementsAvailable.reverse();

    this.skipClick = 0;
    this.hovering = [];

    // TODO use bsearch tree here 8)
    for (let elem of elems) {
      if (shapes.contains(elem, posn)) {
        this.hovering.push(elem);
      } else if (shapes.overlap(elem, posnPadded)) {
        this.hovering.push(elem);
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
    let target;

    if (this.editor.state.textEditHandler) {
      // We're in text edit mode
      this.editor.finishEditingText();
    }

    if (this.hovering.length > 0) {
      let skipClick = this.skipClick % this.hovering.length;

      if (this.hovering.length > skipClick) {
        target = this.hovering[skipClick];
      } else {
        target = this.hovering.last();
      }
    }

    if (target) {
      if (e.shiftKey) {
        this.editor.toggleInSelection([target]);
      } else {
        if (!this.editor.isSelected(target)) {
          this.editor.selectItems([target]);
        }
      }
    } else {
      this.editor.selectItems([]);
    }
  }

  handleMouseup(e, cursor) {}

  handleClick(e, cursor) {
    this.skipClick++;
  }

  handleDoubleClick(e, cursor) {
    if (this.hovering.length === 1 && this.hovering[0] instanceof Text) {
      let item = this.hovering[0];
      let posn = cursor.posnCurrent
        .clone()
        .rotate(item.metadata.angle, item.bounds().center());

      let position = item.cursorPositionAtPosn(posn);

      this.editor.editText(item.index, position);
    }

    // TODO group drill-down handling
  }

  handleDragStart(e, cursor) {
    if (this.editor.state.selection.empty) {
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

      let elems = this.editor.doc.elementsAvailable;
      for (let elem of elems) {
        if (shapes.overlap(bounds, elem)) {
          newSelection.push(elem);
        }
      }

      this.editor.selectItems(newSelection);

      this.dragSelectStart = null;
      this.dragSelectEnd = null;
    } else {
      // Commit ongoing nudge
      this.editor.commitFrame();
    }

    delete this.annotation;
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
          let sb = this.editor.state.selection.bounds;
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

    if (e.shiftKey && !this.dragSelectStart) {
      posn = snapping.toDegs(cursor.posnDown, posn, degs_45_90);

      let delta = posn.delta(cursor.posnDown);

      this.annotation = {
        type: 'line',
        delta
      };
    }

    return posn;
  }
}
