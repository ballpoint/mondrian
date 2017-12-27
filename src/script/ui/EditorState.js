import { Cursor } from 'ui/tools/tools';
import Posn from 'geometry/posn';
import Index from 'geometry/index';
import Selection from 'ui/selection';
import DefaultAttributes from 'ui/DefaultAttributes';

export default class EditorState {
  constructor(editor, doc, state = {}) {
    if (doc) {
      this.doc = doc;
      let defaults = EditorState.defaultsFor(editor, doc);

      for (let key in defaults) {
        if (state[key] === undefined) state[key] = defaults[key];
      }
    }

    for (let key in state) {
      this[key] = state[key];
    }
  }

  static defaultsFor(editor, doc) {
    return {
      position: doc.center(),
      layer: doc.layers[0],
      zoomLevel: 1,

      selection: new Selection(doc, []),
      hovering: new Selection(doc, []), // Note: not persisted to proto
      scope: new Index([0]),
      tool: new Cursor(editor),

      attributes: new DefaultAttributes()
    };
  }

  static forDoc(editor, doc) {
    return new EditorState(editor, doc, this.defaultsFor(editor, doc));
  }

  static empty(editor) {
    return new EditorState(editor, null, {
      position: new Posn(0, 0),
      layer: null,
      zoomLevel: 1,

      selection: new Selection(null, []),
      hovering: new Selection(null, []), // Note: not persisted to proto
      scope: new Index([0]),
      tool: new Cursor(editor),

      attributes: new DefaultAttributes()
    });
  }
}
