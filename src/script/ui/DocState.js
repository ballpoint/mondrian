import Index from 'geometry/index';
import Selection from 'ui/selection';

export default class DocState {
  constructor(state = {}) {
    this.state = state;
  }

  static forDoc(doc) {
    return new DocState({
      position: doc.center(),
      layer: doc.layers[0],
      zoomLevel: 1,
      selection: new Selection([]),
      hovering: new Selection([]),
      scope: new Index([0])
    });
  }
}
