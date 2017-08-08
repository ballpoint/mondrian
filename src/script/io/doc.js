import io from 'io/io';
import Layer from 'io/layer';
import DocHistory from 'history/history';
import HistoryFrame from 'history/Frame';
import * as actions from 'history/actions/actions';

import Index from 'geometry/index';
import Bounds from 'geometry/bounds'
import Posn from 'geometry/posn'
import Group from 'geometry/group';
import Path from 'geometry/path';
import PathPoint from 'geometry/path-point';
import PointsSegment from 'geometry/points-segment';
import Item from 'geometry/item';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

const MIMETYPE = 'image/svg+xml';
const CHARSET  = 'utf-8';

export default class Doc {
  constructor(attrs) {
    this.layers = attrs.layers;
    this.width = attrs.width;
    this.height = attrs.height;
    this.name = attrs.name;

    this.bounds = new Bounds(0, 0, this.width, this.height);

    this.cacheIndexes(this);

    this.history = new DocHistory();
  }

  static fromSVG(str, name) {
    let doc = new DOMParser().parseFromString(str, MIMETYPE);

    console.log(doc);

    // TODO check how this works in firefox etc. this is for chrome.
    let parserError = doc.querySelector('parsererror');
    if (parserError) {
      let errorDiv = parserError.querySelector('div');
      throw new Error(errorDiv.innerHTML);
    }

    // Parse SVG document
    let root = doc.querySelector('svg');
    if (!root) {
      throw new Error('No svg node in given doc');
    }
    let children = io.parse(doc.querySelector('svg'));

    let { width, height, transform } = this.parseDimensions(root);

    io.applyRootAttrs(root, children);

    // Apply viewbox transformation
    if (transform) {
      for (let child of children) {
        transform(child);
      }
    }

    // TODO parse layers from SVG mondrian: attr
    let layer = new Layer({
      id: 'main',
      children
    });

    return new Doc({
      layers: [layer],
      width,
      height,
      name,
    });
  }

  clone() {
    return Doc.fromSVG(this.toSVG());
  }

  static parseDimensions(root) {
    let width, height, transform;

    let widthAttr = root.getAttribute('width');
    let heightAttr = root.getAttribute('height');
    let viewboxAttr = root.getAttribute('viewBox') || root.getAttribute('viewbox');

    if (viewboxAttr) {
      let parts = viewboxAttr.split(' ').filter((p) => { return p !== '' });

      if (parts.length === 4) {
        parts = parts.map(parseFloat);
        let x = parts[0];
        let y = parts[1];
        let w = parts[2];
        let h = parts[3];

        width = w;
        height = h;

        if (x !== 0 || y !== 0) {
          transform = (item) => {
            item.nudge(-x, -y);
          }
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

    return { width, height, transform }
  }

  get elements() {
    // Flatten groups
    return this.layers.reduce((accum, layer) => {
      return accum.concat(layer.children)
    }, []);
  }

  get elementsFlat() {
    // Flatten groups
    return this.layers.reduce((accum, layer) => {
      return accum.concat(layer.childrenFlat)
    }, []);
  }

  get elementsAvailable() {
    // Return elements that can be manipulated in the editor (not locked, visible)
    return this.filterAvailable(this.elements);
  }

  get children() {
    return this.layers;
  }

  child(i) {
    return this.layers[i];
  }

  toDocument() {
    let doc = io.createSVGElement('svg');

    doc.setAttribute('width', this.width);
    doc.setAttribute('height', this.height);

    for (let item of this.elements) {
      doc.appendChild(io.itemToElement(item));
    }

    return doc;
  }

  perform(h) {
    if (h instanceof HistoryFrame) {
      for (let action of h.actions) {
        action.perform(this);
      }
      this.history.pushFrame(h);
    } else if (h instanceof actions.HistoryAction) {
      h.perform(this);
      this.history.pushAction(h);
    }
  }

  undo() {
    this.history.undo(this);
  }

  redo() {
    this.history.redo(this);
  }

  jumpToHistoryDepth(d) {
    this.history.jumpToDepth(this, d);
  }

  toSVG() {
    let doc = this.toDocument();
    doc.setAttribute('xmlns:mondrian', 'http://mondrian.io/xml');

    let str = new XMLSerializer().serializeToString(doc);
    // Make better whitespace management happen later
    str = str.replace(/>/gi, ">\n");
    
    return '<!-- Made in Mondrian.io -->\n'+str;
  }

  toBase64() {
    return btoa(this.toSVG());
  }

  toBase64URI() {
    return `data:image/svg+xml;charset=utf-8;base64,${this.toBase64URI()}`;
  }

  isLocked(child) {
    let index = child.index;
    // Check to see if item or any of its parents are locked
    while (index.length > 0) {
      let item = this.getFromIndex(index);
      if (item.metadata.locked) return true;
      index = index.parent;
    }

    return false;
  }

  isVisible(child) {
    let index = child.index;
    // Check to see if item or any of its parents are locked
    while (index.length > 0) {
      let item = this.getFromIndex(index);
      if (!item.metadata.visible) return false;
      index = index.parent;
    }

    return true;
  }

  isAvailable(child) {
    return this.isVisible(child) && !this.isLocked(child);
  }

  filterAvailable(children) {
    return children.filter(this.isAvailable.bind(this));
  }

  removeIndexes(indexes) {
    let marked = indexes.map(this.getFromIndex.bind(this));

    for (let item of marked) {
      let parent = this.getFromIndex(item.index.parent);
      parent.remove(item);
    }

    this.cacheIndexes(this);
  }

  removeItem(elem) {
    let layer = this.getLayerWithElement(elem);
    if (layer) {
      layer.remove(elem);
    }
  }

  getLayerWithElement(elem) {
    for (let layer of this.layers) {
      if (layer.children.indexOf(elem) !== -1) {
        return layer;
      }
    }
  }

  center() {
    return new Posn(this.width/2, this.height/2);
  }

  toString() {
    return new XMLSerializer().serializeToString(this.doc);
  }

  toBase64() {
    return `data:${MIMETYPE};charset=${CHARSET};base64,${this.toString()}`;
  }

  cacheIndexes(root=this, accum=[]) {
    for (let i = 0; i < root.children.length; i ++) {
      let child = root.children[i];
      child.index = new Index(accum.concat([i]));
      if (child instanceof Group || child instanceof Layer) {
        this.cacheIndexes(child, accum.concat([i]));
      }
    }
  }

  getFromIndex(index) {
    let cursor = this;

    for (let i of index.parts) {
      if (cursor === this || cursor instanceof Group || cursor instanceof Layer) {
        cursor = cursor.children[i];
      } else if (cursor instanceof Path) {
        cursor = cursor.points.segments[i];
      } else if (cursor instanceof PointsSegment) {
        cursor = cursor.points[i];
      } else {
        console.error('Cant handle index drill-down for cursor', cursor);
      }
    }

    return cursor;
  }

  insert(layer, i) {
    this.layers = this.layers.insertAt(layer, i);
  }

  drawToCanvas(layer, context, projection) {
    for (let child of this.layers) {
      child.drawToCanvas(layer, context, projection);
    }
  }
}
