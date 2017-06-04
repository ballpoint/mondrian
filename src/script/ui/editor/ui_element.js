export default class UIElement {
  constructor(editor, id) {
    this.editor = editor;
    this.id = id;
  }

  refresh(layer, context) {
    if (!this._refresh) {
      console.warn('No refresh defined for UIElement ' + this.id);
    } else {
      this._refresh.call(this, this.editor, layer, context);
    }
  }
}
