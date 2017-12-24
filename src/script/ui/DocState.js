import Index from 'geometry/index';
import Selection from 'ui/selection';

export default class DocState {
  constructor(state = {}) {
    for (let key in state) {
      this[key] = state[key];
    }
  }

  static forDoc(doc) {
    return new DocState({
      position: doc.center(),
      layer: doc.layers[0],
      zoomLevel: 1,
      selection: new Selection(doc, []),
      hovering: new Selection(doc, []),
      scope: new Index([0])
    });
  }
}
