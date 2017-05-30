import _ from 'lodash';
import LineSegment from 'geometry/line-segment'
import Bounds from 'geometry/bounds'
import Element from 'ui/element';

const CTRL_PT_DIMEN = 7;

let transformer = {
  reset() {
    for (let id of ['tl', 'tr', 'bl', 'br', 'tm', 'lm', 'rm', 'bm']) {
      transformer.unregisterCtrlPoint.call(this, id);
    }
  },

  refresh(layer, context) {
    if (this.state.selection.length === 0) {
      transformer.reset.call(this);
      return;
    }

    let bounds = this.projection.bounds(this.state.selectionBounds);

    let center = this.projection.posn(this.state.selectionBounds.center());
    let angle = 0;
    let selectedAngles = _.uniq(this.state.selection.map((e) => { return e.metadata.angle }));
    if (selectedAngles.length === 1) {
      angle = selectedAngles;
    }

    // Draw transformer box

    // Corners
    let tl = bounds.tl().rotate(angle, center).sharp();
    let tr = bounds.tr().rotate(angle, center).sharp();
    let br = bounds.br().rotate(angle, center).sharp();
    let bl = bounds.bl().rotate(angle, center).sharp();

    // Edges
    let tm = bounds.tm().rotate(angle, center).sharp();
    let bm = bounds.bm().rotate(angle, center).sharp();
    let rm = bounds.rm().rotate(angle, center).sharp();
    let lm = bounds.lm().rotate(angle, center).sharp();

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

    // Corner ctrl points
    transformer.registerCtrlPoint.call(this, 'tl', layer, tl);
    transformer.registerCtrlPoint.call(this, 'tr', layer, tr);
    transformer.registerCtrlPoint.call(this, 'bl', layer, bl);
    transformer.registerCtrlPoint.call(this, 'br', layer, br);

    transformer.registerCtrlPoint.call(this, 't', layer, tm);
    transformer.registerCtrlPoint.call(this, 'b', layer, bm);
    transformer.registerCtrlPoint.call(this, 'l', layer, lm);
    transformer.registerCtrlPoint.call(this, 'r', layer, rm);

    transformer.registerRotationPoint.call(this, 'tl', layer, tl.clone().nudge(-CTRL_PT_DIMEN,-CTRL_PT_DIMEN));
  },

  registerCtrlPoint(which, layer, origin) {
    let id = 'transformer:scale:'+which;

    let opposite;

    let ctrlBounds = Bounds.centeredOnPosn(origin.sharp(), CTRL_PT_DIMEN, CTRL_PT_DIMEN);

    let ctrlOpts = {
      stroke: 'blue'
    };

    if (this.cursorHandler.active && this.cursorHandler.active.id === id) {
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

        // NOTE: When it comes time to do snapping, we may want to switch this code
        // to be operating on bounds on the doc level (rather than the UI level)
        let bounds = this.state.selectionBounds;
        let resultBounds = bounds.clone();

        switch (which) {
          case 'tl':
            opposite = bounds.br();
            resultBounds.moveEdge('t', diffY).moveEdge('l', diffX);
            break;
          case 'tr':
            opposite = bounds.bl();
            resultBounds.moveEdge('t', diffY).moveEdge('r', diffX);
            break;
          case 'br':
            opposite = bounds.tl();
            resultBounds.moveEdge('b', diffY).moveEdge('r', diffX);
            break;
          case 'bl':
            opposite = bounds.tr();
            resultBounds.moveEdge('b', diffY).moveEdge('l', diffX);
            break;
          case 't':
            opposite = bounds.bm();
            resultBounds.moveEdge('t', diffY);
            break;
          case 'b':
            opposite = bounds.tm();
            resultBounds.moveEdge('b', diffY);
            break;
          case 'l':
            opposite = bounds.rm();
            resultBounds.moveEdge('l', diffX);
            break;
          case 'r':
            opposite = bounds.lm();
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
      },
      'drag:stop': (e, posn, startPosn) => {
        e.stopPropagation();
      }
    })

    this.cursorHandler.registerElement(elem)
  },

  unregisterCtrlPoint(id) {
    id = 'transformer:scale:'+id;
    this.cursorHandler.unregisterElement(id);
  },

  registerRotationPoint(id, layer, posn) {
    id = 'transformer:rotate:'+id;
    let ctrlBounds = Bounds.centeredOnPosn(posn.sharp(), CTRL_PT_DIMEN, CTRL_PT_DIMEN);

    let ctrlOpts = { stroke: 'red' };

    if (this.cursorHandler.active && this.cursorHandler.active.id === id) {
      ctrlOpts.fill = 'red';
    }

    layer.drawRect(ctrlBounds, ctrlOpts);

    let elem = new Element(id, ctrlBounds, {
      'mousedown': function (e, posn) {
        e.stopPropagation();
      },

      'drag': (e, posn, lastPosn) => {
        e.stopPropagation();
        let center = this.state.selectionBounds.center();

        let lineBefore = new LineSegment(lastPosn, center);
        let lineAfter  = new LineSegment(posn, center);

        let angleDelta = lineBefore.angle - lineAfter.angle;

        this.rotateSelected(angleDelta, center);
      }
    });

    this.cursorHandler.registerElement(elem);
  }

}

export default transformer;
