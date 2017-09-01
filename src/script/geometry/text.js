import Posn from 'geometry/posn';
import Range from 'geometry/range';
import Bounds from 'geometry/bounds';
import Item from 'geometry/item';
import LineSegment from 'geometry/line-segment';
import { measure } from 'lib/text';

export class Tspan {
  constructor(data) {
    this.data = data;
  }

  /*
  getRanges() {}

  bounds(anchor) {
    let metrics = this.metrics();
    //let anchor = new Posn(this.container.data.x, this.container.data.y);
    if (this.data.x !== undefined) anchor.x = this.data.x;
    if (this.data.y !== undefined) anchor.y = this.data.y;

    let textAnchor = 'start';
    if (this.container.data['text-anchor']) {
      textAnchor = this.container.data['text-anchor'];
    }

    switch (textAnchor) {
      case 'start':
      default:
        return new Bounds(
          anchor.x,
          anchor.y - this.data.size,
          metrics.width,
          this.data.size
        );
    }
  }
  */
}

export default class Text extends Item {
  constructor(data) {
    if (data.x === undefined) data.x = 0;
    if (data.y === undefined) data.y = 0;
    if (data.size === undefined) data.size = 12;
    data.x = parseFloat(data.x);
    data.y = parseFloat(data.y);

    data.width = 100;
    data.height = 50;

    data.spacing = 1.2;

    data.align = 'center';
    data.valign = 'bottom';

    super(data);
  }

  fontStyle(z) {
    return `${this.fontSize(z)} ${this.fontFamily()}`;
  }

  fontFamily(z) {
    let family = 'sans-serif';
    return family;
  }

  fontSize(z) {
    return `${this.data.size * z}pt`;
  }

  spans() {
    // Get cached spans or generate them
    if (this._cachedSpans !== undefined) return this._cachedSpans;

    let spans = [];
    let words = this.data.value.split(' ');
    let cursor = new Posn(this.data.x, this.data.y);
    let fontStyle = this.fontStyle(1);
    let spaceWidth = measure(' ', fontStyle).width;

    let currentSpan = [];

    let commitSpan = () => {
      let textAlign = this.data.align;
      let x;
      switch (textAlign) {
        case 'left':
          x = this.data.x;
          break;
        case 'center':
          x = this.data.x + this.data.width / 2;
          break;
        case 'right':
          x = this.data.x + this.data.width;
          break;
      }
      // line break
      spans.push(
        new Tspan({
          x,
          y: cursor.y + this.data.size,
          value: currentSpan.join(' '),
          size: this.data.size
        })
      );

      cursor.x = this.data.x;
      cursor.y += this.data.spacing * this.data.size;
      currentSpan = [];
    };

    for (let word of words) {
      let w = measure(word, fontStyle).width;

      if (
        cursor.x + w > this.data.x + this.data.width &&
        currentSpan.length > 0
      ) {
        commitSpan();
      }

      // same line
      currentSpan.push(word);
      cursor.x += spaceWidth + w;
    }

    commitSpan();

    // Fix vertical align now that we know # of spans
    if (this.data.valign !== 'top') {
      let extraV =
        this.data.height - spans.length * this.data.size * this.data.spacing;
      for (let span of spans) {
        switch (this.data.valign) {
          case 'center':
            span.data.y += extraV / 2;
            break;
          case 'bottom':
            span.data.y += extraV;
            break;
        }
      }
    }

    this._cachedSpans = spans;

    return spans;
  }

  drawToCanvas(layer, context, projection) {
    if (this.metadata.visible === false) return;

    let cursor = new Posn(this.data.x, this.data.y);

    context.font = this.fontStyle(projection.z(1));

    for (let span of this.spans()) {
      context.fillStyle = 'black';

      context.textAlign = this.data.align;

      context.fillText(
        span.data.value,
        projection.x(span.data.x),
        projection.y(span.data.y)
      );
    }
  }

  getRanges() {
    return {
      xrs: new Range(0, 10),
      yrs: new Range(0, 10)
    };
  }

  nudge(x, y) {
    this.data.x += x;
    this.data.y += y;

    this.clearCache();
  }

  scale(x, y, origin) {
    let b = this.bounds().scale(x, y, origin);
    this.data.x = b.x;
    this.data.y = b.y;
    this.data.width = b.width;
    this.data.height = b.height;

    this.clearCache();
  }

  bounds() {
    return new Bounds(
      this.data.x,
      this.data.y,
      this.data.width,
      this.data.height
    );
  }

  lineSegments() {
    return this.bounds().lineSegments();
  }

  clearCache() {
    delete this._cachedSpans;
  }
}
