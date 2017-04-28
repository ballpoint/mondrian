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
    transformer.registerCtrlPoint.call(this, 'tl', layer, tl);
    transformer.registerCtrlPoint.call(this, 'tr', layer, tr);
    transformer.registerCtrlPoint.call(this, 'bl', layer, bl);
    transformer.registerCtrlPoint.call(this, 'br', layer, br);

    transformer.registerCtrlPoint.call(this, 't', layer, tm);
    transformer.registerCtrlPoint.call(this, 'b', layer, bm);
    transformer.registerCtrlPoint.call(this, 'l', layer, lm);
    transformer.registerCtrlPoint.call(this, 'r', layer, rm);
  },

  registerCtrlPoint(which, layer, origin) {
    let id = 'transformer:'+which;
    let ctrlBounds = Bounds.centeredOnPosn(origin.sharp(), CTRL_PT_DIMEN, CTRL_PT_DIMEN);

    let ctrlOpts = {
      stroke: 'blue'
    };

    if (this.elements.active && this.elements.active.id === id) {
      ctrlOpts.fill = 'blue';
    }

    layer.drawRect(ctrlBounds, ctrlOpts);

    let elem = new Element(id, ctrlBounds, {
      'mousedown': function (e, posn) {
        e.stopPropagation();
      },
      'click': function (e, posn) {
        e.stopPropagation();
      },
      'drag': (e, posn, lastPosn) => {
        e.stopPropagation();

        let diffY = posn.y - lastPosn.y;
        let diffX = posn.x - lastPosn.x;

        let docBounds = this.selectionBounds();
        let bounds = this.projection.bounds(docBounds);
        let resultBounds = bounds.clone();

        let opposite;
        switch (which) {
          case 'tl':
            opposite = docBounds.br();
            resultBounds.moveEdge('t', diffY).moveEdge('l', diffX);
            break;
          case 'tr':
            opposite = docBounds.bl();
            resultBounds.moveEdge('t', diffY).moveEdge('r', diffX);
            break;
          case 'br':
            opposite = docBounds.tl();
            resultBounds.moveEdge('b', diffY).moveEdge('r', diffX);
            break;
          case 'bl':
            opposite = docBounds.tr();
            resultBounds.moveEdge('b', diffY).moveEdge('l', diffX);
            break;
          case 't':
            opposite = docBounds.bm();
            resultBounds.moveEdge('t', diffY);
            break;
          case 'b':
            opposite = docBounds.tm();
            resultBounds.moveEdge('b', diffY);
            break;
          case 'l':
            opposite = docBounds.rm();
            resultBounds.moveEdge('l', diffX);
            break;
          case 'r':
            opposite = docBounds.lm();
            resultBounds.moveEdge('r', diffX);
            break;
        }

        let xScale = 1, yScale = 1;

        if (resultBounds.height !== bounds.height) {
          yScale = 1 + ((resultBounds.height - bounds.height)/bounds.height);
        }
        if (resultBounds.width !== bounds.width) {
          xScale = 1 + ((resultBounds.width - bounds.width)/bounds.width);
        }

        this.scaleSelected(xScale, yScale, opposite);
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
