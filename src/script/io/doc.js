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
    let root = doc.querySelector('svg');
    if (!root) {
      throw new Error('No svg node in given doc');
    }
    let children = io.parse(doc.querySelector('svg'));
    let width = parseInt(root.getAttribute('width'), 10);
    let height = parseInt(root.getAttribute('height'), 10);

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

  toSVG() {
    // TODO
  }

  // Constructor helpers

  _assignMondrianNamespace() {
    // Make the mondrian: namespace legal
    // return this._svgRoot.setAttribute('xmlns:mondrian', 'http://mondrian.io/xml');
  }

  removeIndexes(indexes) {
    let marked = indexes.map(this.getFromIndex.bind(this));

    // Assuming that all marked elements are of the same type
    // - Item
    // - PathPoint
    for (let item of marked) {
      if (item instanceof Item || item instanceof Group) {
        this.removeItem(item);
      } else if (item instanceof PathPoint) {
        this.removePathPoint(item);
      }
    }

    this.cacheIndexes(this);
  }

  removeItem(elem) {
    let layer = this.getLayerWithElement(elem);
    if (layer) {
      layer.remove(elem);
    }
  }

  removePathPoint(pt) {
    let owner = pt.owner;
    if (owner) {
      owner.removePoint(pt);
    }
  }

  insertAtQueries(items) {
    items = items.sort((a, b) => {
      return b.index - a.index;
    });
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
}
