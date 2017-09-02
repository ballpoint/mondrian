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

    let words = [];
    let textLines = this.data.value.split('\n');

    for (let line of textLines) {
      words = words.concat(line.split(' '));
      words.push('\n');
    }

    let cursor = new Posn(this.data.x, this.data.y);
    let fontStyle = this.fontStyle();
    let spaceWidth = measure(' ', fontStyle).width;

    let lines = [];

    let currentLine = [];

    let newline = () => {
      if (currentLine.length === 0) return;

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
          value: currentLine.join(' '),
          size: this.data.size
        })
      );

      cursor.x = this.data.x;
      cursor.y += this.data.spacing * this.data.size;
      currentLine = [];
    };

    for (let word of words) {
      // TODO add option to ignore this
      if (word === '\n') {
        newline();
        continue;
      }

      let w = measure(word, fontStyle).width;

      if (
        cursor.x + w > this.data.x + this.data.width &&
        currentLine.length > 0
      ) {
        newline();
      }

      // same line
      currentLine.push(word);
      cursor.x += spaceWidth + w;
    }

    newline();

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

  lineBounds(line) {
    let w = measure(line.data.value, this.fontStyle()).width;
    let h = this.data.size;

    switch (this.data.align) {
      case 'left':
        return new Bounds(line.data.x, line.data.y - h, w, h);
      case 'center':
        return new Bounds(line.data.x - w / 2, line.data.y - h, w, h);
      case 'right':
        return new Bounds(line.data.x - w, line.data.y - h, w, h);
    }
  }

  lineSegments() {
    if (this._cachedLineSegments !== undefined) return this._cachedLineSegments;

    let lss = [];
    // For each TextLine append its bounds' line segments

    for (let line of this.lines()) {
      let b = this.lineBounds(line);
      lss = lss.concat(b.lineSegments());
    }

    this._cachedLineSegments = lss;

    return lss;
  }

  positionAtPosn(posn) {
    // Return character position at posn

    let cursorPosition = 0;

    for (let line of this.lines()) {
      let v = line.data.value;
      let b = this.lineBounds(line);
      if (b.contains(posn)) {
        // Y value is correct, so now find x value

        let accum = '';
        let lastX = this.data.x;

        for (let i = 0; i < v.length; i++) {
          let char = v[i];
          accum += char;

          let w = measure(accum, this.fontStyle()).width;
          let newX = this.data.x + w;

          console.log(i, char, accum, w, lastX, newX, posn.x);

          if (lastX < posn.x && newX > posn.x) {
            // We found the magic char
            if (posn.x - lastX > newX - posn.x) {
              cursorPosition += i + 1;
              break;
            } else {
              cursorPosition += i;
              break;
            }
          }

          lastX = newX;
        }

        break;
      }

      cursorPosition += v.length;
      cursorPosition += 1; // newline
    }

    return cursorPosition;
  }

  clearCache() {
    delete this._cachedLines;
    delete this._cachedLineSegments;
  }
}
