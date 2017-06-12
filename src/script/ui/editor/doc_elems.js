import UIElement from 'ui/editor/ui_element';

export default class DocumentPointsUIElement extends UIElement {
  reset() {

  }

  _refresh(layer, context) {
    this.reset();

    let tool = this.editor.state.tool;
    let selection = this.editor.state.selection;

    if (this.editor.state.selectionType === 'ELEMENTS') {
      for (let elem of selection) {
        this.drawOutlines(elem, layer);
      }
    }

    if (tool.id === 'cursor') {

      let hovering = tool.hovering;
      if (hovering && !this.editor.isSelected(hovering)) {
        this.drawOutlines(hovering, layer);
      }
    }
  }

  drawOutlines(elem, layer) {
    let ls = elem.lineSegments();
    for (let line of ls) {
      layer.context.beginPath();
      layer.drawLine(this.editor.projection.line(line));
      layer.context.strokeStyle = 'blue';
      layer.context.stroke();
    }

  }
}
