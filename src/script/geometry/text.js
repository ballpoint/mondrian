import Posn from 'geometry/posn';
import Range from 'geometry/range';
import Bounds from 'geometry/bounds';
import Item from 'geometry/item';
import LineSegment from 'geometry/line-segment';
import { measure } from 'lib/text';

export class TextLine {
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
    if (data.x === undefined) data.x = 100;
    if (data.y === undefined) data.y = 100;
    if (data.size === undefined) data.size = 12;

    data.x = parseFloat(data.x);
    data.y = parseFloat(data.y);
    data.width = parseFloat(data.width);
    data.height = parseFloat(data.height);

    data.spacing = 1.2;

    if (data.align === undefined) data.align = 'left';
    if (data.valign === undefined) data.valign = 'top';

    super(data);
  }

  fontStyle() {
    return `${this.fontSize()} ${this.fontFamily()}`;
  }

  fontFamily(z) {
    let family = 'sans-serif';
    return family;
  }

  fontSize() {
    return `${this.data.size}pt`;
  }

  lines() {
    // Get cached lines or generate them
    if (this._cachedLines !== undefined) return this._cachedLines;

    let lines = [];
    let words = this.data.value.split(' ');
    let cursor = new Posn(this.data.x, this.data.y);
    let fontStyle = this.fontStyle();
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
      lines.push(
        new TextLine({
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

    // Fix vertical align now that we know # of lines
    if (this.data.valign !== 'top') {
      let extraV =
        this.data.height - lines.length * this.data.size * this.data.spacing;
      for (let span of lines) {
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

    this._cachedLines = lines;

    return lines;
  }

  drawToCanvas(layer, context, projection) {
    if (this.metadata.visible === false) return;

    let cursor = new Posn(this.data.x, this.data.y);

    context.font = this.fontStyle();

    for (let span of this.lines()) {
      context.fillStyle = 'black';

      context.textAlign = this.data.align;

      context.save();

      context.translate(projection.x(span.data.x), projection.y(span.data.y));
      context.scale(projection.z(1), projection.z(1));

      context.fillText(span.data.value, 0, 0);

      context.restore();
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
    delete this._cachedLines;
  }
}
