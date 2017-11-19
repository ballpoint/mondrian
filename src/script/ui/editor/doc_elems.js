import consts from 'consts';
import UIElement from 'ui/editor/ui_element';

import { ELEMENTS, POINTS, PHANDLE, SHANDLE } from 'ui/selection';

export default class DocumentPointsUIElement extends UIElement {
  reset() {}

  _refresh(layer, context) {
    this.reset();
    if (!this.editor.doc) return;

    let tool = this.editor.state.tool;
    let selection = this.editor.doc.state.selection;

    if (this.editor.doc.state.selection.type === ELEMENTS) {
      if (this.editor.state.textEditHandler === undefined) {
        for (let elem of selection.items) {
          this.drawOutlines(elem, layer);
        }
      }
    }

    let hovering = this.editor.doc.state.hovering;

    for (let elem of hovering.items) {
      if (elem.metadata.visible && !this.editor.isSelected(elem)) {
        this.drawOutlines(elem, layer);
      }
    }
  }

  drawOutlines(elem, layer) {
    let ls = elem.lineSegments();
    for (let line of ls) {
      layer.context.beginPath();
      layer.drawLine(this.editor.projection.line(line));
      layer.context.strokeStyle = consts.blue;
      layer.context.stroke();
    }
  }
}
