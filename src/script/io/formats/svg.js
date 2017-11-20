import consts from 'consts';

import Doc from 'io/doc';
import Layer from 'io/layer';

import Bounds from 'geometry/bounds';
import Posn from 'geometry/posn';
import Path from 'geometry/path';
import Item from 'geometry/item';
import Group from 'geometry/group';
import Text from 'geometry/text';

const MIMETYPE = 'image/svg+xml';
const CHARSET = 'utf-8';

export default {
  serialize(doc) {
    let svgDoc = this.createSVGElement('svg');

    svgDoc.setAttribute('width', doc.width);
    svgDoc.setAttribute('height', doc.height);
    svgDoc.setAttribute('xmlns:mondrian', 'https://mondrian.io/xml');

    for (let item of doc.elements) {
      svgDoc.appendChild(this.itemToElement(item));
    }

    let str = new XMLSerializer().serializeToString(svgDoc);
    // Make better whitespace management happen later
    str = str.replace(/>/gi, '>\n');

    return '<!-- Made in Mondrian.io -->\n' + str;
  },

  parse(bytes, filename) {
    let str;
    if (_.isString(bytes)) {
      str = bytes;
    } else {
      let dec = new TextDecoder('utf-8');
      str = dec.decode(bytes);
    }
    let svgDoc = new DOMParser().parseFromString(str, MIMETYPE);
    let root = svgDoc.getElementsByTagName('svg')[0];
    let children = this.parseChildren(root);

    let { width, height, transform } = this.parseDimensions(root);

    this.applyRootAttrs(root, children);

    let name = filename.replace(/\.svg.*$/, '');

    // Apply viewbox transformation
    if (transform) {
      for (let child of children) {
        transform(child);
      }
    }

    let layer = new Layer({
      id: 'main',
      children
    });

    return new Doc({
      layers: [layer],
      width,
      height,
      name
    });
  },

  parseChildren(container) {
    let results = [];
    for (let i = 0; i < container.childNodes.length; i++) {
      let node = container.childNodes[i];
      if (node.nodeName === 'defs') {
        // <defs> symbols... for now we don't do much with this.
        continue;
      } else if (node.nodeName === '#text') {
        // This is like whitespace and shit
        continue;
      } else if (node.nodeName === 'g') {
        if (node.getAttribute('mondrian:type') === 'text') {
          // Special handling of text groups (multi-line Text class)
          results.push(this.parseTextGroup(node));
        } else {
          let group = new Group(this.parseChildren(node));
          this.applyTransform(node, group);
          this.applyStyles(node, group);

          if (group.children.length === 0) {
            // Omit empty group
          } else if (group.children.length === 1) {
            // Expand unnecessary group
            results.push(group.children[0]);
          } else {
            results.push(group);
          }
        }
      } else if (node.nodeName === 'text') {
        // TODO handle tspan
        let d = {
          x: parseFloat(node.getAttribute('x')),
          y: parseFloat(node.getAttribute('y')),
          width: 200,
          height: 50,
          value: this.innerTextValue(node)
        };

        let mWidth = node.getAttribute('mondrian:width');
        let mHeight = node.getAttribute('mondrian:height');

        if (mWidth && mHeight) {
          d.width = parseFloat(mWidth);
          d.height = parseFloat(mHeight);
        }

        results.push(new Text(d));
      } else {
        // Otherwise it must be a shape node we have a class for.
        let parsed = this.parseElement(node);

        if (parsed === null) {
          //console.log(node, 'not handled');
          continue;
        }

        // Any geometric shapes
        if (parsed instanceof Item) {
          this.applyTransform(node, parsed);
          this.applyStyles(node, parsed);
          results.push(parsed);

          // <use> tag
        } else if (parsed instanceof Object && parsed['xlink:href'] != null) {
          parsed.reference = true;
          results.push(parsed);
        }
      }
    }

    return results;
  },

  parseTextGroup(node) {
    let d = {
      x: parseFloat(node.getAttribute('mondrian:x')),
      y: parseFloat(node.getAttribute('mondrian:y')),
      width: parseFloat(node.getAttribute('mondrian:width')),
      height: parseFloat(node.getAttribute('mondrian:height')),
      spacing: parseFloat(node.getAttribute('mondrian:spacing')),
      size: parseFloat(node.style['font-size']),
      value: ''
    };

    let lines = [];

    for (let i = 0; i < node.childNodes.length; i++) {
      let node = container.childNodes[i];
      if (child.nodeName.toLowerCase() === 'text') {
        lines.push(this.innerTextValue(child));
      }
    }

    d.value = lines.join(' ');

    return new Text(d);
  },

  innerTextValue(node) {
    let value = '';

    for (let i = 0; i < node.childNodes.length; i++) {
      let node = container.childNodes[i];
      switch (child.nodeName) {
        case 'tspan':
          // <tspan>
          value += child.innerHTML;
          break;
        case '#text':
          // Text node
          if (child.textContent === '\n') continue;
          value += child.textContent;
          break;
      }
    }

    if (value[0] === '\n') {
      value = value.slice(1);
    }

    return value;
  },

  applyTransform(node, elem) {
    let transform = node.getAttribute('transform');
    if (!transform) return;

    let items = transform.match(/[a-z]+\([^\)]*\)/gi);
    for (let item of items) {
      let action = item.match(/^[a-z]+/gi);
      let args = item.match(/\(.*\)$/);

      if (action && args) {
        action = action[0].strip();
        args = args[0]
          .replace(/[\(\)]/g, '')
          .split(/[,\s]+/)
          .map(s => {
            return s.strip();
          });
      } else {
        console.warn('Failed to parse transform', item);
      }

      let x, y, deg, origin;

      switch (action) {
        case 'translate':
          x = parseFloat(args[0]);
          y = parseFloat(args[1]);

          elem.nudge(x, y);
          break;
        case 'scale':
          x = parseFloat(args[0]);
          if (args.length >= 2) {
            y = parseFloat(args[1]);
          }
          elem.nudge(x, y, new Posn(0, 0));
          break;
        case 'rotate':
          x = 0;
          y = 0;
          deg = parseFloat(args[0]);
          if (args.length >= 3) {
            x = parseFloat(args[1]);
            y = parseFloat(args[2]);
          }
          origin = new Posn(x, y);
          elem.rotate(deg, origin);
          break;
        case 'matrix':
          if (args.length === 6) {
            let a, b, c, d, e, f;
            a = parseFloat(args[0]);
            b = parseFloat(args[1]);
            c = parseFloat(args[2]);
            d = parseFloat(args[3]);
            e = parseFloat(args[4]);
            f = parseFloat(args[5]);
            elem.matrix(a, b, c, e, d, f);
          }
          break;
      }
    }
  },

  applyStyles(node, elem) {
    let blacklist = ['display', 'transform'];

    for (let i = 0; i < node.attributes.length; i++) {
      let attr = node.attributes[i];
      let key = attr.name;
      let val = attr.value;

      if (key === 'style') {
        let styles = val.split(';');
        for (let style of styles) {
          if (style.strip() === '') continue;

          style = style.split(':');
          let key = style[0].strip();
          let val = style[1].strip();

          if (blacklist.has(key)) continue;

          this.applyStyle(elem, key, val);
        }
      } else {
        this.applyStyle(elem, key, val);
      }
    }
  },

  applyStyle(elem, key, val) {
    switch (key) {
      case 'fill':
        elem.setFill(val);
        break;
      case 'stroke':
        elem.setStroke(val);
        break;
      case 'stroke-width':
        elem.setStrokeWidth(val);
        break;
      case 'stroke-linecap':
        elem.setStrokeLineCap(val);
        break;
      case 'stroke-linejoin':
        elem.setStrokeLineJoin(val);
        break;
      default:
        //console.warn('TODO handle style', key, val);
        break;
    }
  },

  applyRootAttrs(root, elems) {
    for (let i = 0; i < root.attributes.length; i++) {
      let attr = root.attributes[i];
      let key = attr.name;
      let val = attr.value;

      for (let elem of elems) {
        this.applyStyle(elem, key, val);
      }
    }
  },

  parseElement(elem) {
    let data = this.makeData(elem);
    let type = elem.nodeName.toLowerCase();
    let result;

    switch (type) {
      case 'path':
        result = new Path(data);
        break;
      case 'rect':
        result = Path.rectangle(data);
        break;
      case 'ellipse':
        result = Path.ellipse(data);
        break;
      case 'circle':
        data.rx = data.r;
        data.ry = data.r;
        delete data.r;
        result = Path.ellipse(data);
        break;
      case 'polyline':
        result = Path.polyline(data);
        break;
      case 'line':
        result = Path.line(data);
        break;
      case 'polygon':
        result = Path.polygon(data);
        break;
      default:
        // TODO handle these
        return null;
        break;
    }

    if (result) {
      return result;
    }
  },

  makeData(elem) {
    let blacklist = ['inkscape', 'sodipodi', 'uuid', 'transform', 'style'];

    let blacklistCheck = function(key) {
      for (let x of Array.from(blacklist)) {
        if (key.indexOf(x) > -1) {
          return false;
        }
      }
      return true;
    };

    let attrs = elem.attributes;
    let data = {};

    for (let key in attrs) {
      let val = attrs[key];
      key = val.name;
      val = val.value;
      if (key === '') {
        continue;
      }

      if (val != null && blacklistCheck(key)) {
        if (/^\d+$/.test(val)) {
          val = parseFloat(val);
        }
        data[key] = val;
      }
    }

    //elem.removeAttribute("transform")

    return data;
  },

  createSVGElement(type) {
    return document.createElementNS(consts.svgNamespace, type);
  },

  itemToElement(item) {
    if (item instanceof Path) {
      let elem = this.createSVGElement('path');
      item.commitData();
      for (let key in item.data) {
        elem.setAttribute(key, item.data[key]);
      }
      return elem;
    } else if (item instanceof Group) {
      let g = this.createSVGElement('g');

      for (let child of item.children) {
        let childElem = this.itemToElement(child);
        if (childElem) {
          g.appendChild(childElem);
        }
      }
      return g;
    } else if (item instanceof Text) {
      let lines = item.lines();

      let lineToElem = (item, line, opts = {}) => {
        let textElem = this.createSVGElement('text');
        for (let key of ['x', 'y']) {
          textElem.setAttribute(key, line.data[key]);
        }

        textElem.setAttribute('mondrian:width', item.data.width);
        textElem.setAttribute('mondrian:height', item.data.height);

        textElem.setAttribute('fill', item.data.fill.toString());
        textElem.setAttribute('stroke', item.data.stroke.toString());

        if (!opts.partOfGroup) {
          textElem.setAttribute('font-size', item.fontSize());
          textElem.setAttribute('font-family', item.fontFamily());
        }

        textElem.innerHTML = line.data.value;

        textElem.setAttribute(
          'text-anchor',
          {
            left: 'start',
            center: 'middle',
            right: 'end'
          }[item.data.align]
        );

        return textElem;
      };

      // Multi-line text is handled as a group of <text> nodes
      let groupElem = this.createSVGElement('g');

      groupElem.setAttribute('mondrian:type', 'text');

      groupElem.setAttribute('mondrian:x', item.data.x);
      groupElem.setAttribute('mondrian:y', item.data.y);
      groupElem.setAttribute('mondrian:width', item.data.width);
      groupElem.setAttribute('mondrian:height', item.data.height);
      groupElem.setAttribute('mondrian:spacing', item.data.height);

      groupElem.setAttribute('fill', item.data.fill.toString());
      groupElem.setAttribute('stroke', item.data.stroke.toString());

      groupElem.setAttribute('font-size', item.fontSize());
      groupElem.setAttribute('font-family', item.fontFamily());

      for (let line of lines) {
        let textElem = lineToElem(item, line, { partOfGroup: true });
        groupElem.appendChild(textElem);
      }
      return groupElem;
    } else {
      console.warn('Cannot transform to element:', item);
    }
  },

  parseDimensions(root) {
    let width, height, transform;

    let widthAttr = root.getAttribute('width');
    let heightAttr = root.getAttribute('height');
    let viewboxAttr =
      root.getAttribute('viewBox') || root.getAttribute('viewbox');

    if (viewboxAttr) {
      let parts = viewboxAttr.split(' ').filter(p => {
        return p !== '';
      });

      if (parts.length === 4) {
        parts = parts.map(parseFloat);
        let x = parts[0];
        let y = parts[1];
        let w = parts[2];
        let h = parts[3];

        width = w;
        height = h;

        if (x !== 0 || y !== 0) {
          transform = item => {
            item.nudge(-x, -y);
          };
        }
      }
    } else {
      if (widthAttr) {
        width = parseFloat(widthAttr);
      }
      if (heightAttr) {
        height = parseFloat(heightAttr);
      }
    }

    if (width === undefined || isNaN(width)) width = 1000;
    if (height === undefined || isNaN(height)) height = 1000;

    return { width, height, transform };
  }
};
