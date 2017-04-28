import LineSegment from 'geometry/line-segment'
import Bounds from 'geometry/bounds'
import Element from 'ui/element';

const CTRL_PT_DIMEN = 7;

let transformer = {
  refresh(layer, context) {
    if (this.state.selection.length === 0) {
      transformer.unregisterCtrlPoint.call(this, layer, 'tm');
      return;
    }

    let boundsList = [];

    for (let elem of this.state.selection) {
      boundsList.push(elem.bounds());
    }

    let bounds = this.projection.bounds(new Bounds(boundsList));

    // Draw transformer box

    // Corners
    let tl = bounds.tl().sharp();
    let tr = bounds.tr().sharp();
    let br = bounds.br().sharp();
    let bl = bounds.bl().sharp();


    // Edges
    let tm = bounds.tm().sharp();
    let bm = bounds.bm().sharp();
    let rm = bounds.rm().sharp();
    let lm = bounds.lm().sharp();

    // Control point dimens
    const d = CTRL_PT_DIMEN;
    const opts = { stroke: 'blue' };
    const ctrlOpts = { stroke: 'blue', centerPosn: true };

    // Top edge
    layer.drawLineSegment(tl.clone().nudge(d/2,0), tm.clone().nudge(-(d/2),0), opts);
    layer.drawLineSegment(tm.clone().nudge(d/2,0), tr.clone().nudge(-(d/2),0),  opts);
    // Bottom edge
    layer.drawLineSegment(bl.clone().nudge(d/2,0), bm.clone().nudge(-(d/2),0), opts);
    layer.drawLineSegment(bm.clone().nudge(d/2,0), br.clone().nudge(-(d/2),0),  opts);
    // Left edge
    layer.drawLineSegment(tl.clone().nudge(0,d/2), lm.clone().nudge(0,-d/2), opts);
    layer.drawLineSegment(lm.clone().nudge(0,d/2), bl.clone().nudge(0,-d/2), opts);
    // Right edge
    layer.drawLineSegment(tr.clone().nudge(0,d/2), rm.clone().nudge(0,-d/2), opts);
    layer.drawLineSegment(rm.clone().nudge(0,d/2), br.clone().nudge(0,-d/2), opts);

    // Side ctrl points
    layer.drawRect(new Bounds(bm.x, bm.y, d, d), ctrlOpts);
    layer.drawRect(new Bounds(rm.x, rm.y, d, d), ctrlOpts);
    layer.drawRect(new Bounds(lm.x, lm.y, d, d), ctrlOpts);

    // Corner ctrl points
    layer.drawRect(new Bounds(tl.x, tl.y, d, d), ctrlOpts);
    layer.drawRect(new Bounds(tr.x, tr.y, d, d), ctrlOpts);
    layer.drawRect(new Bounds(bl.x, bl.y, d, d), ctrlOpts);
    layer.drawRect(new Bounds(br.x, br.y, d, d), ctrlOpts);

    transformer.drawCtrlPoint.call(this, 't', layer, tm);
    transformer.registerCtrlPoint.call(this, 't', layer, tm, bm);
  },

  drawCtrlPoint(edge, layer, origin) {
    let id = 'transformer:'+edge;
    let ctrlBounds = Bounds.centeredOnPosn(origin.sharp(), CTRL_PT_DIMEN, CTRL_PT_DIMEN);

    let ctrlOpts = {
      stroke: 'blue'
    };

    if (this.elements.active && this.elements.active.id === id) {
      ctrlOpts.fill = 'blue';
    }

    layer.drawRect(ctrlBounds, ctrlOpts);
  },

  registerCtrlPoint(edge, layer, origin) {
    let id = 'transformer:'+edge;
    let ctrlBounds = Bounds.centeredOnPosn(origin.sharp(), CTRL_PT_DIMEN, CTRL_PT_DIMEN);

    let editor = this;

    let elem = new Element(id, ctrlBounds, {
      'mousedown': function (e, posn) {
        e.stopPropagation();
      },
      'click': function (e, posn) {
        e.stopPropagation();
      },
      'drag': function (e, posn, lastPosn) {
        e.stopPropagation();

        let diff = posn.y - lastPosn.y;
        if (diff === 0) return;

        let docBounds = editor.selectionBounds();
        let bounds = editor.projection.bounds(docBounds);

        let opposite;
        switch (edge) {
          case 't':
            opposite = docBounds.bm();
            break;
        }

        let resultBounds = bounds.clone().moveEdge(edge, diff);

        console.log(bounds, resultBounds);

        let yScale = 1 + ((resultBounds.height - bounds.height)/bounds.height);

        for (let elem of editor.state.selection) {
          elem.scale(1, yScale, opposite);
          editor.canvas.refreshAll();
        }

      }
    })

    this.elements.registerElement(elem)
  },

  unregisterCtrlPoint(layer, id) {
    id = 'transformer:'+id;
    this.elements.unregisterElement(id);
  }
}

export default transformer;
