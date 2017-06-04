import consts from 'consts';
import UIElement from 'ui/editor/ui_element';

export default class SelectedPtsUIElement extends UIElement {
  reset() {
    
  }

  _refresh(layer, context) {
    this.reset();

    /*
    if (this.editor.state.selectionType === 'POINTS') {
      for (let pt of this.editor.state.selection) {
        this.drawSelectedPoint(layer, pt);
      }
    }
    */
    let tool = this.editor.state.tool;

    if (tool.id === 'subcursor') {
      for (let elem of this.editor.doc.elements) {
        let points = elem.points.all();
        for (let i = 0; i < points.length; i ++) {
          let pt = points[i];
          if (this.editor.state.selection.has(pt)) {
            // REGISTER CTRL PTS HERE
          } else if (pt === tool.hovering) {
            layer.drawCircle(this.editor.projection.posn(pt), 2.5, { stroke: consts.point, fill: consts.point });
          } else {
            layer.drawCircle(this.editor.projection.posn(pt), 2.5, { stroke: consts.point, fill: 'white' });
          }
        }
      }


      if (editor.state.selectionType === 'POINTS') {
        // draw selected pts
        for (let pt of editor.state.selection) {
        }
      }
    }

  }
};
