import Posn from 'geometry/posn';
import LineSegment from 'geometry/line-segment'
import Bounds from 'geometry/bounds'
import Circle from 'geometry/circle'
import Element from 'ui/element';
import UIElement from 'ui/editor/ui_element';

const CTRL_PT_DIMEN = 7;

export default class TransformerUIElement extends UIElement {
  constructor(editor, id) {
    super(...arguments);

    //editor.on('change:selection', this.calculateSelectionBounds.bind(this));
  }

  reset() {
    for (let id of ['tl', 'tr', 'bl', 'br', 'tm', 'lm', 'rm', 'bm']) {
      id = 'transformer:scale:'+id;
      this.editor.cursorHandler.unregisterElement(id);
    }
    for (let id of ['tl', 'tr', 'bl', 'br']) {
      id = 'transformer:rotate:'+id;
      this.editor.cursorHandler.unregisterElement(id);
    }
  }

  oppositeX(which) {
    switch (which) {
      case 'l':
        return 'r';
      case 'r':
        return 'l';
      case 'tl':
        return 'tr';
      case 'bl':
        return 'br';
      case 'tr':
        return 'tl';
      case 'br':
        return 'bl';
    }
  }

  oppositeY(which) {
    switch (which) {
      case 't':
        return 'b';
      case 'b':
        return 't';
      case 'tl':
        return 'bl';
      case 'bl':
        return 'tl';
      case 'tr':
        return 'br';
      case 'br':
        return 'tr';
    }
  }

  oppositeForPoint(which, bounds) {
     switch (which) {
      case 'tl':
        return bounds.br();
      case 'tr':
        return bounds.bl();
      case 'br':
        return bounds.tl();
      case 'bl':
        return bounds.tr();
      case 't':
        return bounds.bm();
      case 'b':
        return bounds.tm();
      case 'l':
        return bounds.rm();
      case 'r':
        return bounds.lm();
    }
  }

  points() {
    let tl = bounds.tl().rotate(angle, center).sharp();
    let tr = bounds.tr().rotate(angle, center).sharp();
    let br = bounds.br().rotate(angle, center).sharp();
    let bl = bounds.bl().rotate(angle, center).sharp();

    // Edges
    let tm = bounds.tm().rotate(angle, center).sharp();
    let bm = bounds.bm().rotate(angle, center).sharp();
    let rm = bounds.rm().rotate(angle, center).sharp();
    let lm = bounds.lm().rotate(angle, center).sharp();
  }

  _refresh(layer, context) {
    let selection = this.editor.state.selection;

    if (selection.length === 0) {
      this.reset(this.editor);
      return;
    }

    if (this.editor.state.selectionType !== 'ELEMENTS') {
      return;
    }

    let bounds = this.editor.projection.bounds(this.editor.state.selectionBounds.bounds);
    let { angle, center } = this.editor.state.selectionBounds;
    center = this.editor.projection.posn(center);

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
    const d2 = d/2;
    const opts = { stroke: 'blue' };
    const ctrlOpts = { stroke: 'blue', centerPosn: true };

    // TL -> TM
    layer.drawLineSegment(
      new Posn(bounds.l, bounds.t).nudge(d2, 0).rotate(angle, center),
      new Posn(bounds.l+(bounds.width/2), bounds.t).nudge(-d2, 0).rotate(angle, center),
    opts);

    // TM -> TR
    layer.drawLineSegment(
      new Posn(bounds.l+(bounds.width/2), bounds.t).nudge(d2, 0).rotate(angle, center),
      new Posn(bounds.r, bounds.t).nudge(-d2, 0).rotate(angle, center),
      lm, bl,
    opts);

    // BL -> BM
    layer.drawLineSegment(
      new Posn(bounds.l, bounds.b).nudge(d2, 0).rotate(angle, center),
      new Posn(bounds.l+(bounds.width/2), bounds.b).nudge(-d2, 0).rotate(angle, center),
    opts);

    // BM -> BR
    layer.drawLineSegment(
      new Posn(bounds.l+(bounds.width/2), bounds.b).nudge(d2, 0).rotate(angle, center),
      new Posn(bounds.r, bounds.b).nudge(-d2, 0).rotate(angle, center),
      lm, bl,
    opts);

    // TL -> LM
    layer.drawLineSegment(
      new Posn(bounds.l, bounds.t).nudge(0, d2).rotate(angle, center),
      new Posn(bounds.l, bounds.t+(bounds.height/2)).nudge(0, -d2).rotate(angle, center),
    opts);

    // LM -> BL
    layer.drawLineSegment(
      new Posn(bounds.l, bounds.t+(bounds.height/2)).nudge(0, d2).rotate(angle, center),
      new Posn(bounds.l, bounds.b).nudge(0, -d2).rotate(angle, center),
      lm, bl,
    opts);


    // TR -> RM
    layer.drawLineSegment(
      new Posn(bounds.r, bounds.t).nudge(0, d2).rotate(angle, center),
      new Posn(bounds.r, bounds.t+(bounds.height/2)).nudge(0, -d2).rotate(angle, center),
    opts);

    // RM -> BR
    layer.drawLineSegment(
      new Posn(bounds.r, bounds.t+(bounds.height/2)).nudge(0, d2).rotate(angle, center),
      new Posn(bounds.r, bounds.b).nudge(0, -d2).rotate(angle, center),
      lm, bl,
    opts);

    // Corner ctrl points
    this.registerCtrlPoint('tl', layer, tl);
    this.registerCtrlPoint('tr', layer, tr);
    this.registerCtrlPoint('bl', layer, bl);
    this.registerCtrlPoint('br', layer, br);

    this.registerCtrlPoint('t', layer, tm);
    this.registerCtrlPoint('b', layer, bm);
    this.registerCtrlPoint('l', layer, lm);
    this.registerCtrlPoint('r', layer, rm);

    let rotationExpandedBounds = bounds.clone().padded(6);
    this.registerRotationPoint('tl', layer, rotationExpandedBounds.tl());
    this.registerRotationPoint('tr', layer, rotationExpandedBounds.tr());
    this.registerRotationPoint('bl', layer, rotationExpandedBounds.bl());
    this.registerRotationPoint('br', layer, rotationExpandedBounds.br());
  }

  registerCtrlPoint(which, layer, origin) {
    let id = 'transformer:scale:'+which;

    let opposite;

    let ctrlBounds = Bounds.centeredOnPosn(origin.sharp(), CTRL_PT_DIMEN, CTRL_PT_DIMEN);

    let ctrlOpts = {
      stroke: 'blue'
    };

    if (this.editor.cursorHandler.isActive(id)) {
      ctrlOpts.fill = 'blue';
    }

    let { angle } = this.editor.state.selectionBounds;
    ctrlBounds.angle = angle;
    layer.drawRect(ctrlBounds, ctrlOpts);

    let elem = new Element(id, ctrlBounds, {
      'mousedown': (e, posn) => {
        e.stopPropagation();
      },
      'click': function (e, posn) {
        e.stopPropagation();
      },
      'drag': (e, posn, lastPosn) => {
        e.stopPropagation();

        let bounds = this.editor.state.selectionBounds.bounds;

        opposite = this.oppositeForPoint(which, bounds);

        let { angle, center } = this.editor.state.selectionBounds;

        if (angle !== 0) {
          posn = posn.clone().rotate(-angle, center);
          lastPosn = lastPosn.clone().rotate(-angle, center);
        }

        let diffY = posn.y - lastPosn.y;
        let diffX = posn.x - lastPosn.x;

        // NOTE: When it comes time to do snapping, we may want to switch this code
        // to be operating on bounds on the doc level (rather than the UI level)
        let resultBounds = bounds.clone();

        switch (which) {
          case 'tl':
            resultBounds.moveEdge('t', diffY).moveEdge('l', diffX);
            break;
          case 'tr':
            resultBounds.moveEdge('t', diffY).moveEdge('r', diffX);
            break;
          case 'br':
            resultBounds.moveEdge('b', diffY).moveEdge('r', diffX);
            break;
          case 'bl':
            resultBounds.moveEdge('b', diffY).moveEdge('l', diffX);
            break;
          case 't':
            resultBounds.moveEdge('t', diffY);
            break;
          case 'b':
            resultBounds.moveEdge('b', diffY);
            break;
          case 'l':
            resultBounds.moveEdge('l', diffX);
            break;
          case 'r':
            resultBounds.moveEdge('r', diffX);
            break;
        }

        let flipX = (resultBounds.flipped('x') != bounds.flipped('x'));
        let flipY = (resultBounds.flipped('y') != bounds.flipped('y'));

        let xScale = 1, yScale = 1;

        if (resultBounds.height !== bounds.height) {
          yScale = 1 + ((resultBounds.height - bounds.height)/bounds.height);
        }
        if (resultBounds.width !== bounds.width) {
          xScale = 1 + ((resultBounds.width - bounds.width)/bounds.width);
        }

        if (xScale !== 1 || yScale !== 1) {
          if (flipX) xScale *= -1;
          if (flipY) yScale *= -1;

          this.editor.scaleSelected(xScale, yScale, opposite);

          if (flipX) {
            this.editor.cursorHandler.setActive('transformer:scale:'+this.oppositeX(which));
            //which = this.oppositeX(which);
            // Take new opposite from editor-calculated bounds so that it's perfect
            // Taking it from resultBounds in here is imperfect by at least 0.00001
            //opposite = this.oppositeForPoint(which, this.editor.state.selectionBounds.bounds);
          }

          if (flipY) {
            this.editor.cursorHandler.setActive('transformer:scale:'+this.oppositeY(which));
            //which = this.oppositeY(which);
            // Take new opposite from editor-calculated bounds so that it's perfect
            // Taking it from resultBounds in here is imperfect by at least 0.00001
            //opposite = this.oppositeForPoint(which, this.editor.state.selectionBounds.bounds);
          }
        }
      },
      'drag:stop': (e, posn, startPosn) => {
        e.stopPropagation();
      }
    })

    this.editor.cursorHandler.registerElement(elem)
  }

  registerRotationPoint(id, layer, posn) {
    id = 'transformer:rotate:'+id;
    let ctrlBounds = Bounds.centeredOnPosn(posn.sharp(), CTRL_PT_DIMEN, CTRL_PT_DIMEN);
    let ctrlPt = new Circle(posn, 10);

    //layer.drawCircle(posn, 10, { stroke: 'red' });

    let elem = new Element(id, ctrlPt, {
      'mousedown': function (e, posn) {
        e.stopPropagation();
      },

      'drag': (e, posn, lastPosn) => {
        e.stopPropagation();
        let center = this.editor.state.selectionBounds.center;

        let lineBefore = new LineSegment(lastPosn, center);
        let lineAfter  = new LineSegment(posn, center);

        let angleDelta = lineAfter.angle360 - lineBefore.angle360;

        this.editor.rotateSelected(angleDelta, center);
      }
    });

    this.editor.cursorHandler.registerElement(elem);
  }
}
