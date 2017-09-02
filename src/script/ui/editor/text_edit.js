import UIElement from 'ui/editor/ui_element';

export default class TextEditUIElement extends UIElement {
  reset() {}

  _refresh(layer, context) {
    this.reset();

    let handler = this.editor.state.textEditHandler;
    if (handler === undefined) return;

    console.log(handler.selection);
  }
}
