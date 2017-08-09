import Posn from 'geometry/posn';
import Bounds from 'geometry/bounds';
import UIElement from 'ui/editor/ui_element';
import math from 'lib/math';

const RULER_DIMEN = math.sharpen(20);

export default class RulersUIElement extends UIElement {
  reset() {}

  _refresh(layer, context) {
    layer.setLineWidth(1);

    let docBounds;

    if (this.editor.doc) {
      docBounds = this.editor.screenBounds().sharp();
      layer.drawRect(docBounds, { stroke: 'black' });
    }

    // Draw ruler
    layer.drawRect(new Bounds(-1, -1, 21, 21).sharp(), { fill: '#ffffff' });
    layer.drawRect(new Bounds(20, -1, this.editor.canvas.width, 21).sharp(), {
      fill: '#ffffff'
    });
    layer.drawRect(new Bounds(-1, 20, 21, this.editor.canvas.height).sharp(), {
      fill: '#ffffff'
    });
    layer.drawLineSegment(
      { x: -1, y: RULER_DIMEN },
      { x: this.editor.canvas.width, y: RULER_DIMEN },
      { stroke: '#c9c9c9' }
    );
    layer.drawLineSegment(
      { x: RULER_DIMEN, y: -1 },
      { x: RULER_DIMEN, y: this.editor.canvas.height },
      { stroke: '#c9c9c9' }
    );

    let step = 0.00000001;
    let target = Math.max(0.1, this.editor.projection.zInvert(100));
    let i = 0;
    stepLoop: while (step < target) {
      switch (i) {
        case 0:
          step *= 2;
          i = 1;
          continue stepLoop;
        case 1:
          step *= 2.5;
          i = 2;
          continue stepLoop;
        case 2:
          step *= 2;
          i = 0;
          continue stepLoop;
      }
    }

    for (
      let x = math.roundTo(this.editor.projection.xInvert(RULER_DIMEN), step);
      x < this.editor.projection.xInvert(this.editor.canvas.width);
      x += step
    ) {
      this.drawRulerXTick(layer, x);
    }

    for (
      let y = math.roundTo(this.editor.projection.yInvert(RULER_DIMEN), step);
      y < this.editor.projection.yInvert(this.editor.canvas.height);
      y += step
    ) {
      this.drawRulerYTick(layer, y);
    }
  }

  drawRulerXTick(layer, xval) {
    let x = this.editor.projection.x(xval);
    if (x <= RULER_DIMEN) return;

    layer.drawLineSegment(
      { x, y: 6 },
      { x, y: RULER_DIMEN },
      { stroke: '#000000' }
    );

    layer.drawText(new Posn(x + 4, 15), this.formatLabel(xval), {
      fill: 'black'
    });
  }

  drawRulerYTick(layer, yval) {
    let y = this.editor.projection.y(yval);
    if (y <= RULER_DIMEN) return;

    layer.drawLineSegment(
      { x: 6, y },
      { x: RULER_DIMEN, y },
      { stroke: '#000000' }
    );

    layer.drawText(new Posn(15, y - 4), this.formatLabel(yval), {
      fill: 'black',
      rotate: -90
    });
  }

  formatLabel(val) {
    if (Math.round(val) !== val) {
      return val.toFixed(1);
    } else {
      return val.toFixed(0);
    }
  }
}
