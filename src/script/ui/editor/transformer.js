import _ from 'lodash';
import LineSegment from 'geometry/line-segment'
import Bounds from 'geometry/bounds'
import Element from 'ui/element';
import Point from 'geometry/point';
import UIElement from 'ui/editor/ui_element';

const CTRL_PT_DIMEN = 7;

export default class TransformerUIElement extends UIElement {
  reset() {
    for (let id of ['tl', 'tr', 'bl', 'br', 'tm', 'lm', 'rm', 'bm']) {
      this.unregisterCtrlPoint(id);
    }
  }

  _refresh(layer, context) {
    let selection = this.editor.state.selection;

    if (selection.length === 0) {
      this.reset(this.editor);
      return;
    }

    let selectionType;

    if (this.editor.state.selectionType !== 'ELEMENTS') {
      return;
    }

    let bounds = this.editor.projection.bounds(this.editor.state.selectionBounds);

    let center = this.editor.projection.posn(this.editor.state.selectionBounds.center());
    let angle = 0;


    if (selectionType === 'ELEMS') {
      let selectedAngles = _.uniq(this.editor.state.selection.map((e) => { return e.metadata.angle }));
      if (selectedAngles.length === 1) {
        angle = selectedAngles;
      }
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
    this.registerCtrlPoint('tl', layer, tl);
    this.registerCtrlPoint('tr', layer, tr);
    this.registerCtrlPoint('bl', layer, bl);
    this.registerCtrlPoint('br', layer, br);

    this.registerCtrlPoint('t', layer, tm);
    this.registerCtrlPoint('b', layer, bm);
    this.registerCtrlPoint('l', layer, lm);
    this.registerCtrlPoint('r', layer, rm);

    this.registerRotationPoint('tl', layer, tl.clone().nudge(-CTRL_PT_DIMEN,-CTRL_PT_DIMEN));
  }

  registerCtrlPoint(which, layer, origin) {
    let id = 'transformer:scale:'+which;

    let opposite;

    let ctrlBounds = Bounds.centeredOnPosn(origin.sharp(), CTRL_PT_DIMEN, CTRL_PT_DIMEN);

    let ctrlOpts = {
      stroke: 'blue'
    };

    if (this.editor.cursorHandler.active && this.editor.cursorHandler.active.id === id) {
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
        let bounds = this.editor.state.selectionBounds;
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

        this.editor.scaleSelected(xScale, yScale, opposite);
      },
      'drag:stop': (e, posn, startPosn) => {
        e.stopPropagation();
      }
    })

    this.editor.cursorHandler.registerElement(elem)
  }

  unregisterCtrlPoint(id) {
    id = 'transformer:scale:'+id;
    this.editor.cursorHandler.unregisterElement(id);
  }

  registerRotationPoint(id, layer, posn) {
    id = 'transformer:rotate:'+id;
    let ctrlBounds = Bounds.centeredOnPosn(posn.sharp(), CTRL_PT_DIMEN, CTRL_PT_DIMEN);

    let ctrlOpts = { stroke: 'red' };

    if (this.editor.cursorHandler.active && this.editor.cursorHandler.active.id === id) {
      ctrlOpts.fill = 'red';
    }

    layer.drawRect(ctrlBounds, ctrlOpts);

    let elem = new Element(id, ctrlBounds, {
      'mousedown': function (e, posn) {
        e.stopPropagation();
      },

      'drag': (e, posn, lastPosn) => {
        e.stopPropagation();
        let center = this.editor.state.selectionBounds.center();

        let lineBefore = new LineSegment(lastPosn, center);
        let lineAfter  = new LineSegment(posn, center);

        let angleDelta = lineBefore.angle - lineAfter.angle;

        this.editor.rotateSelected(angleDelta, center);
      }
    });

    this.editor.cursorHandler.registerElement(elem);
  }
}
