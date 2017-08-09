import consts from 'consts';
import Bounds from 'geometry/bounds';
import Posn from 'geometry/posn';
import Path from 'geometry/path';
import Text from 'geometry/text';
import Item from 'geometry/item';
import Group from 'geometry/group';
import UUIDV4 from 'uuid/v4';

let io = {
  parse(container) {
    let results = [];
    for (let node of container.childNodes) {
      if (node.nodeName === 'defs') {
        // <defs> symbols... for now we don't do much with this.
        continue;
      } else if (node.nodeName === '#text') {
        // This is like whitespace and shit
        continue;
      } else if (node.nodeName === 'g') {
        let group = new Group(this.parse(node));
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

  applyTransform(node, elem) {
    let transform = node.getAttribute('transform');
    if (!transform) return;

    let items = transform.match(/[a-z]+\([^\)]*\)/gi);
    for (let item of items) {
      let action = item.match(/^[a-z]+/gi);
      let args = item.match(/\(.*\)$/);

      if (action && args) {
        action = action[0].strip();
        args = args[0].replace(/[\(\)]/g, '').split(/[,\s]+/).map(s => {
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
    let styles = node.getAttribute('style');
    if (!styles) return;

    let blacklist = ['display', 'transform'];

    styles = styles.split(';');
    for (let style of Array.from(styles)) {
      if (style.strip() === '') continue;

      style = style.split(':');
      let key = style[0].strip();
      let val = style[1].strip();

      if (blacklist.has(key)) continue;

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
        default:
          //console.warn('TODO handle style', key, val);
          break;
      }
    }
  },

  applyRootAttrs(root, elems) {
    let keys = ['fill', 'stroke'];

    for (let key of keys) {
      let val = root.getAttribute(key);
      if (val) {
        switch (key) {
          case 'fill':
            for (let elem of elems) elem.setFill(val);
            break;
          case 'stroke':
            for (let elem of elems) elem.setStroke(val);
            break;
        }
      }
    }
  },

  parseElement(elem) {
    let data = this.makeData(elem);
    let type = elem.nodeName.toLowerCase();
    let result;

    switch (type) {
      /*
      case 'text':
        result = new Text(data);
        result.setContent(elem.textContent);
        break;
      */
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
      for (let key in item.data) {
        item.commitData();
        elem.setAttribute(key, item.data[key]);
      }
      return elem;
    } else {
      console.warn('Cannot transform to element:', item);
    }
  }
};

export default io;
