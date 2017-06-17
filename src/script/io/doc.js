import io from 'io/io';
import Layer from 'io/layer';
import Bounds from 'geometry/bounds'
import Posn from 'geometry/posn'

import Path from 'geometry/path';
import PathPoint from 'geometry/path-point';
import Monsvg from 'geometry/monsvg';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

const MIMETYPE = 'image/svg+xml';
const CHARSET  = 'utf-8';

export default class Doc {
  constructor(attrs) {
    this.layers = attrs.layers;
    this.width = attrs.width;
    this.height = attrs.height;

    this.bounds = new Bounds(0, 0, this.width, this.height);

    this._indexElements(this.elements);
  }

  static fromSVG(str) {
    let doc = new DOMParser().parseFromString(str, MIMETYPE);
    let root = doc.querySelector('svg');
    if (!root) {
      throw new Error('No svg node in given doc');
    }
    let elements = io.parse(doc.querySelector('svg'));
    let width = parseInt(root.getAttribute('width'), 10);
    let height = parseInt(root.getAttribute('height'), 10);

    // TODO parse layers from SVG mondrian: attr
    let layer = new Layer({
      id: 'main',
      elements
    });

    return new Doc({
      layers: [layer],
      width,
      height,
    });
  }

  get elements() {
    // Flatten this.layers
    return this.layers.reduce((accum, layer) => {
      return accum.concat(layer.elements)
    }, []);
  }

  toSVG() {
    // TODO
  }

  // Constructor helpers

  _assignMondrianNamespace() {
    // Make the mondrian: namespace legal
    // return this._svgRoot.setAttribute('xmlns:mondrian', 'http://mondrian.io/xml');
  }

  removeQueries(queries) {
    let marked = queries.map(this.getItemFromQuery.bind(this));

    // Assuming that all marked elements are of the same type
    // - Monsvg
    // - PathPoint
    for (let item of marked) {
      if (item instanceof Monsvg) {
        this.removeMonsvg(item);
      } else if (item instanceof PathPoint) {
        this.removePathPoint(item);
      }
    }
  }

  removeMonsvg(elem) {
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

    console.log(items);

  }

  getLayerWithElement(elem) {
    for (let layer of this.layers) {
      if (layer.elements.indexOf(elem) !== -1) {
        return layer;
      }
    }
  }

  removeId(id) {
    let index = -1;
    let newElems = [];
    for (let i = 0; i < this.elements.length; i ++) {
      let elem = this.elements[i];
      if (elem.id === id) {
        index = i;
      } else {
        newElems.push(elem);
      }
    }

    this.elements = newElems;

    return index;
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

  _indexElements(elements) {
    this._elementsIndex = {};
    for (let elem of elements) {
      if (elem.id) {
        this._elementsIndex[elem.id] = elem;
      }
    }
  }

  getQueryForItem(item) {
    if (item instanceof Monsvg) {
      let i = this.elements.indexOf(item);
      if (i > -1) {
        return ''+i;
      } else {
        return null;
      }
    } else if (item instanceof PathPoint) {
      // Return two indices in format 4:82
      let owner = item.owner;
      if (!owner) {
        return null;
      }
      let ownerI = this.elements.indexOf(owner);
      if (ownerI > -1) {
        let pts = owner.points.all();
        let ptI = pts.indexOf(item);
        if (ptI > -1) {
          return ''+ownerI+':'+ptI;
        } else {
          return null;
        }
      } else {
        return null;
      }

    } else {
      console.warn('Cannot get query for', item);
    }
  }

  getItemFromQuery(query) {
    if (!query) {
      return null;
    }
    let parts = query.split(':');
    let elem = this.elements[parts[0]];
    switch (parts.length) {
      case 1:
        return elem;
      case 2:
        let pts = elem.points.all();
        let pt = pts[parts[1]];
        if (pt) {
          return pt;
        }
      default:
        console.warn('Invalid query', query);
        return null;
    }

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

  insertElement(elem, index=0) {
    this.elements = this.elements.slice(0, index).concat([elem]).concat(this.elements.slice(index));
  }
}
