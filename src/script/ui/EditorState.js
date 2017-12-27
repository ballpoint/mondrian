import * as tools from 'ui/tools/tools';
import DefaultAttributes from 'ui/DefaultAttributes';

export default class EditorState {
  constructor(editor, state) {
    this.editor = editor;
    this.tool = state.tool;
    this.attributes = state.attributes;
  }

  static defaultState(editor) {
    return new EditorState(editor, {
      tool: new tools.Cursor(this),
      attributes: new DefaultAttributes()
    });
  }
}
