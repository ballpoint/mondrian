import io from 'io/io';
import Bounds from 'geometry/bounds'
import Posn from 'geometry/posn'

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

const MIMETYPE = 'image/svg+xml';
const CHARSET  = 'utf-8';

/*

  SVG representation class/API

*/

export default class SVG {
  constructor(contents) {
    this._ensureDoc(contents);
    this._assignMondrianNamespace();

    this.root = this.doc.querySelector('svg');
    this._buildMetadata();

    this.elements = io.parse(this.root);

    this._indexElements(this.elements);
  }

  // Constructor helpers

  _ensureDoc(contents) {
    if (typeof(contents) === 'string') {
      // Parse the SVG string
      return this.doc = new DOMParser().parseFromString(contents, MIMETYPE);

    } else if (contents.documentURI != null) {
      // This means it's already a parsed document
      return this.doc = contents;

    } else if (contents instanceof Array) {
      // We've been given a list of Monsvg elements
      this.elements = contents;

      // Create the document from scratch
      this.doc = document.implementation.createDocument(SVG_NAMESPACE, 'svg');

      // Have to do this for some reason
      // It gets created with an <undefined></undefined> element
      this.doc.removeChild(this.doc.childNodes[0]);

      // If we haven't been given an SVG element with
      // a canvas size, just derive it from the elements.
      // This will mean it's "trimmed" from the beginning.
      return this._deriveBoundsFromElements();

    } else {
      throw new Error('Bad input');
    }
  }

  _buildMetadata() {
    this.width = parseInt(this.root.getAttribute('width', 10));
    this.height = parseInt(this.root.getAttribute('height', 10));

    if (this._bounds == null) {
      return this._bounds = new Bounds(0, 0, this.width, this.height);
    }
  }

  _assignMondrianNamespace() {
    // Make the mondrian: namespace legal
    // return this._svgRoot.setAttribute('xmlns:mondrian', 'http://mondrian.io/xml');
  }

  remove(r) {
    this.elements = this.elements.filter((elem) => { return elem !== r });
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
}
