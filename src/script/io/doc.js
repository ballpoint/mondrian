import io from 'io/io';
import Index from 'geometry/index';
import Layer from 'io/layer';
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

    this.bounds = new Bounds(0, 0, this.width, this.height);

    this.cacheIndexes(this);
  }

  static fromSVG(str) {
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
    console.log(children);


    let { width, height, transform } = this.parseDimensions(root);

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

  toSVG() {
    let doc = this.toDocument();

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

  // Constructor helpers

  _assignMondrianNamespace() {
    // Make the mondrian: namespace legal
    // return this._svgRoot.setAttribute('xmlns:mondrian', 'http://mondrian.io/xml');
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

  getElements(ids) {
    let elems = [];
    for (let id of ids) {
      let elem = this._elementsIndex[id];
      if (elem) {
        elems.push(elem);
      }
    }
    return elems;
  }

  insert(layer, i) {
    this.layers = this.layers.insertAt(layer, i);
  }

  drawToCanvas(layer, context, projection) {
    for (let elem of this.elements) {
      elem.drawToCanvas(layer, context, projection);
    }
  }
}
