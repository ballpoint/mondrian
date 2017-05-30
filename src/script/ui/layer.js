import { PIXEL_RATIO } from 'lib/math';

export default class Layer {
  constructor(id) {
    this.id = id;

    this.node = document.createElement('canvas');

    this.context = this.node.getContext('2d');

    this.setLineWidth(1); // DEFAULT

    this.elements = [];
    this.elementsMap = {};

    this.elementState = {
      hovering: null,
    }
  }

  setLineWidth(n) {
    this.context.lineWidth = n / PIXEL_RATIO;
  }

  setFill(color) {
    this.context.fillStyle = color.toString();
  }

  setStroke(color) {
    this.context.strokeStyle = color.toString();
  }

  setDimensions(w, h) {
    let ratio = PIXEL_RATIO;

    this.width = w;
    this.height = h;

    this.node.width  = w*ratio;
    this.node.height = h*ratio;

    this.node.style.width  = w;
    this.node.style.height = h;

    this.context.scale(ratio, ratio);
  }

  resetElements() {
    this.elements = [];
    this.elementsMap = {};
  }

  registerElement(elem) {
    let existing = this.elementsMap[elem.id];
    if (existing) {
      // Replace it
      let index = existing.index;
      elem.index = index;
      this.elements[index] = elem;
      this.elementsMap[elem.id] = elem;
    } else {
      elem.index = this.elements.length;
      this.elements.push(elem);
      this.elementsMap[elem.id] = elem;
    }
  }

  unregisterElement(id) {
    let existing = this.elementsMap[id];
    if (existing) {
      this.elements = this.elements.removeIndex(existing.index);
      delete this.elementsMap[id];
    }
  }

  clear() {
    this.context.clearRect(0, 0, this.width, this.height);
  }

  do(fn, opts) {
    if (opts.fill) {
      this.setFill(opts.fill);
    }
    if (opts.stroke) {
      this.setStroke(opts.stroke);
    }

    fn.call(this);
  }

  drawRect(bounds, opts={}) {
    this.do(() => {
      let { x, y, width, height } = bounds;

      if (opts.centerPosn) {
        x -= (width/2);
        y -= (height/2);
      }

      if (opts.fill) {
        this.context.fillRect(x, y, width, height);
      }
      if (opts.stroke) {
        this.drawLineSegment({ x, y }, { x, y: bounds.y2 }, { stroke: opts.stroke});
        this.drawLineSegment({ x, y }, { x: bounds.x2, y }, { stroke: opts.stroke});
        this.drawLineSegment({ x: bounds.x2, y: bounds.y2 }, { x, y: bounds.y2 }, { stroke: opts.stroke});
        this.drawLineSegment({ x: bounds.x2, y: bounds.y2 }, { x: bounds.x2, y }, { stroke: opts.stroke});
      }
    }, opts);
  }

  drawCircle(posn, radius, opts={}) {
    this.do(() => {
      this.context.beginPath();
      this.context.arc(posn.x, posn.y, radius, 0, Math.PI*2,true);
      this.context.closePath();

      if (opts.fill) this.context.fill();
      if (opts.stroke) this.context.stroke();
    }, opts);
  }

  drawLineSegment(p1, p2, opts={}) {
    this.do(() => {
      this.context.beginPath();
      this.context.moveTo(p1.x, p1.y);
      this.context.lineTo(p2.x, p2.y);
      this.context.stroke();
    }, opts);
  }

  moveTo(posn) {
    this.context.moveTo(posn.x, posn.y);
  }

  lineTo(posn) {
    this.context.lineTo(posn.x, posn.y);
  }

  bezierCurveTo(p2, p3, p4) {
    this.context.bezierCurveTo(p2.x, p2.y, p3.x, p3.y, p4.x, p4.y);
  }

  drawLine(line) {
    if (line.a && line.b) {
      this.lineTo(line.b);
    } else if (line.p2 && line.p3 && line.p4) {
      this.bezierCurveTo(
        line.p2,
        line.p3,
        line.p4,
      );
    }
  }
}
