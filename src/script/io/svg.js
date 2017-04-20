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
    this.metadata = {};

    this.metadata.width = parseInt(this._svgAttr('width', 10));
    this.metadata.height = parseInt(this._svgAttr('height', 10));

    if (this._bounds == null) {
      return this._bounds = new Bounds(0, 0, this.metadata.width, this.metadata.height);
    }
  }

  _assignMondrianNamespace() {
    // Make the mondrian: namespace legal
    // return this._svgRoot.setAttribute('xmlns:mondrian', 'http://mondrian.io/xml');
  }

  _elementsBounds() {
    return new Bounds(this.elements.map(elem => elem.bounds()));
  }

  toString() {
    return new XMLSerializer().serializeToString(this.doc);
  }

  toBase64() {
    return `data:${MIMETYPE};charset=${CHARSET};base64,${this.toString()}`;
  }
}
