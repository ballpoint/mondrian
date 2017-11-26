import Layer from 'io/layer';
import DocHistory from 'history/history';
import HistoryFrame from 'history/Frame';
import * as actions from 'history/actions/actions';

import Index from 'geometry/index';
import Bounds from 'geometry/bounds';
import Posn from 'geometry/posn';
import Group from 'geometry/group';
import Path from 'geometry/path';
import PathPoint from 'geometry/path-point';
import PointsSegment from 'geometry/points-segment';
import Item from 'geometry/item';

import UUIDV4 from 'uuid/v4';
import shortid from 'shortid';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

const MIMETYPE = 'image/svg+xml';
const CHARSET = 'utf-8';

const DOC_BACKENDS = {
  UNKNOWN: 0,
  LOCAL: 1
};

export default class Doc {
  constructor(attrs) {
    this.layers = attrs.layers;
    this.setDimens(attrs.width, attrs.height);

    this.name = attrs.name;
    if (this.name === '') this.name = 'untitled';

    this.cacheIndexes(this);

    if (attrs.history) {
      this.history = attrs.history;
    } else {
      this.history = new DocHistory();
    }

    this.__id__ = attrs.__id__ || shortid.generate();
  }

  static empty(width, height, name) {
    return new Doc({
      layers: [new Layer({ id: 'main', children: [] })],
      width,
      height,
      name
    });
  }

  filename(extension) {
    return this.name.split('.')[0] + '.' + extension;
  }

  setDimens(w, h) {
    if (w <= 0) w = 1;
    if (h <= 0) h = 1;

    this.width = w;
    this.height = h;
    this.bounds = new Bounds(0, 0, this.width, this.height);
  }

  setName(name) {
    this.name = name;
  }

  clone() {
    // TODO
    throw new Error('TODO');
  }

  nextChildIndex() {
    return new Index([this.layers.length]);
  }

  get elements() {
    // Flatten groups
    return this.layers.reduce((accum, layer) => {
      return accum.concat(layer.children);
    }, []);
  }

  get elementsFlat() {
    // Flatten groups
    return this.layers.reduce((accum, layer) => {
      return accum.concat(layer.childrenFlat);
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

  stageFrame(frame) {
    this.history.stageFrame(frame, this);
  }

  commitFrame(frame) {
    this.history.commitFrame();
  }

  abandonFrame(frame) {
    this.history.abandonFrame(this);
  }

  perform(h) {
    if (h instanceof HistoryFrame) {
      this.history.stageFrame(h, this);
    } else if (h instanceof actions.HistoryAction) {
      this.history.pushAction(h, this);
    }
  }

  undo() {
    this.history.undo(this);
  }

  resetStage() {
    this.history.resetStage(this);
  }

  redo() {
    this.history.redo(this);
  }

  jumpToHistoryDepth(d) {
    this.history.jumpToDepth(this, d);
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
    indexes = indexes.slice(0).sort((a, b) => {
      return b.compare(a);
    });

    for (let index of indexes) {
      let parent = this;

      if (index.length > 1) {
        // length of 1 is a layer
        parent = this.getFromIndex(index.parent);
      }

      let item = this.getFromIndex(index);
      parent.remove(item);
    }

    this.cacheIndexes(this);
  }

  remove(rm) {
    this.layers = this.layers.filter(layer => {
      return layer !== rm;
    });
  }

  shiftIndex(index, delta) {
    // Given delta of 1 or -1, shifts item at index so its index increases by delta
    let parent = this.getFromIndex(index.parent);
    let item = this.getFromIndex(index);
    let last = index.last;
    let ceil = parent.children.length - 1;
    let r;

    // [ 0, 1, 2, 3, 4 ]
    // index 2, delta 4
    // 5 - 2 = 3
    //

    switch (delta) {
      case 1:
        if (last === ceil) {
          return;
        }

        r = parent.children[last + 1];
        parent.children[last + 1] = item;
        parent.children[last] = r;
        break;
      case -1:
        if (last === 0) {
          return;
        }
        r = parent.children[last - 1];
        parent.children[last - 1] = item;
        parent.children[last] = r;
        break;
    }

    this.cacheIndexes();
  }

  center() {
    return new Posn(this.width / 2, this.height / 2);
  }

  toString() {
    return new XMLSerializer().serializeToString(this.doc);
  }

  cacheIndexes(root = this, accum = []) {
    //console.time('cacheIndexes');
    for (let i = 0; i < root.children.length; i++) {
      let child = root.children[i];
      child.index = new Index(accum.concat([i]));
      if (child instanceof Group || child instanceof Layer) {
        this.cacheIndexes(child, accum.concat([i]));
      }
    }
    //console.timeEnd('cacheIndexes');
  }

  getFromIndex(index) {
    let cursor = this;

    for (let i of index.parts) {
      if (
        cursor === this ||
        cursor instanceof Group ||
        cursor instanceof Layer
      ) {
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
