import Tool from 'ui/tools/tool';
import shapes from 'lab/shapes';
import Bounds from 'geometry/bounds';

import HistoryFrame from 'history/Frame';
import * as actions from 'history/actions/actions';

export default class Eyedropper extends Tool {
  get id() {
    return 'eyedropper';
  }

  handleMouseup(e, cursor) {
    if (this.frame) {
      this.editor.commitFrame();
      delete this.frame;
    }
  }

  handleMousedown(e, cursor) {
    this.sample(e, cursor);
  }

  handleDrag(e, cursor) {
    this.sample(e, cursor);
  }

  sample(e, cursor) {
    let posn = cursor.posnCurrent;

    let z3 = this.editor.projection.zInvert(3);
    let posnPadded = Bounds.centeredOnPosn(posn, z3, z3);

    let elems = this.editor.doc.elementsFlat.slice(0).reverse();

    let chosen;

    for (let elem of elems) {
      let bp = elem.bounds().padded(z3);

      if (bp.contains(posn)) {
        if (shapes.contains(elem, posn)) {
          chosen = elem;
          break;
        } else if (shapes.overlap(elem, posnPadded)) {
          chosen = elem;
          break;
        }
      }
    }

    if (chosen) {
      let { fill, stroke } = chosen.data;

      if (
        this.editor.state.selection.length > 0 &&
        this.editor.state.selectionType === 'ELEMENTS'
      ) {
        this.frame = new HistoryFrame(
          [
            actions.SetAttributeAction.forItems(
              this.editor.state.selection,
              'fill',
              fill
            ),
            actions.SetAttributeAction.forItems(
              this.editor.state.selection,
              'stroke',
              stroke
            )
          ],
          'Sample colors'
        );

        this.editor.stageFrame(this.frame);
      } else {
        this.editor.setColorState('fill', fill);
        this.editor.setColorState('stroke', stroke);
      }
    }
  }
}
