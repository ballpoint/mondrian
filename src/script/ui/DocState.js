import { Cursor } from 'ui/tools/tools';
import Index from 'geometry/index';
import Selection from 'ui/selection';
import DefaultAttributes from 'ui/DefaultAttributes';

export default class DocState {
  constructor(doc, state = {}) {
    this.doc = doc;
    let defaults = DocState.defaultsFor(doc);

    console.log(state.position);

    for (let key in defaults) {
      if (state[key] === undefined) state[key] = defaults[key];
    }

    for (let key in state) {
      this[key] = state[key];
    }

    console.log(state.position);
  }

  static defaultsFor(doc) {
    return {
      position: doc.center(),
      layer: doc.layers[0],
      zoomLevel: 1,

      selection: new Selection(doc, []),
      hovering: new Selection(doc, []), // Note: not persisted to proto
      scope: new Index([0]),
      tool: new Cursor(doc),

      attributes: new DefaultAttributes()
    };
  }

  static forDoc(doc) {
    return new DocState(doc, this.defaultsFor(doc));
  }
}
