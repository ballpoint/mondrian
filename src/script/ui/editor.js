import { PIXEL_RATIO } from 'lib/math';
import { scaleLinear } from 'd3-scale';
import consts from 'consts';
import Color from 'ui/color';
import EventEmitter from 'lib/events';
import Canvas from 'ui/canvas';

import Posn from 'geometry/posn';
import Group from 'geometry/group';
import Index from 'geometry/index';
import Path from 'geometry/path';
import PathPoint from 'geometry/path-point';
import PointsSegment from 'geometry/points-segment';

import Layer from 'io/layer';

import Projection from 'ui/projection';
import hotkeys from 'ui/hotkeys';
import Bounds from 'geometry/bounds'
import Element from 'ui/element';
import CursorTracking from 'ui/cursor-tracking';
import CursorHandler from 'ui/cursor-handler';

import DocHistory from 'history/history';
import * as actions from 'history/actions/actions';
import HistoryFrame from 'history/Frame';

import Cursor from 'ui/tools/cursor';
import SubCursor from 'ui/tools/subcursor';
import Zoom from 'ui/tools/zoom';
import Pen from 'ui/tools/pen';
import Paw from 'ui/tools/paw';

import RulersUIElement from 'ui/editor/rulers';
import TransformerUIElement from 'ui/editor/transformer';
import DocumentPointsUIElement from 'ui/editor/doc_pts';
import DocumentElemsUIElement from 'ui/editor/doc_elems';


export default class Editor extends EventEmitter {
  constructor(root) {
    super();

    window.$e = this; // DEBUGGING

    if (root) {
      this.root = root;
      this.initState();
      this.initCanvas();
    }
  }

  load(doc) {
    this.doc = doc;
    window.doc = doc;

    this.history = new DocHistory();
    window.h = this.history;

    this.setPosition(doc.center());
    this.setCurrentLayer(doc.layers[0]);

    this.canvas.refreshAll();
  }

  initCanvas() {
    this.canvas = new Canvas(this.root);

    this.cursor = new CursorTracking(this.root);

    this.cursorHandler = new CursorHandler(this.cursor);
    window.$ch = this.cursorHandler;

    // UIElements
    let uiElems = [
      new DocumentPointsUIElement(this, 'doc-pts'),
      new DocumentElemsUIElement(this, 'doc-elems'),
      new TransformerUIElement(this, 'transformer'),
      new RulersUIElement(this, 'rulers'),
    ]

    this.canvas.createLayer('background', this.refreshBackground.bind(this));
    this.canvas.createLayer('drawing', this.refreshDrawing.bind(this));
    this.canvas.createLayer('tool', this.refreshTool.bind(this));
    this.canvas.createLayer('ui', (layer, context) => {
      for (let elem of uiElems) {
        elem.refresh(layer, context);
      }
    });
    this.canvas.createLayer('debug', () => {});

    this.cursorHandler.on('mousemove', (e, posn) => {
      if (e.propagateToTool) this.state.tool.handleMousemove(e, posn);
      this.canvas.refresh('tool');
      this.canvas.refresh('ui');
    });

    this.cursorHandler.on('mousedown', (e, posn) => {
      if (e.propagateToTool) this.state.tool.handleMousedown(e, posn);
      this.canvas.refresh('tool');
      this.canvas.refresh('ui');
    });

    this.cursorHandler.on('click', (e, posn) => {
      if (e.propagateToTool) this.state.tool.handleClick(e, posn);
      this.canvas.refresh('tool');
      this.canvas.refresh('ui');
    });

    this.cursorHandler.on('drag:start', (e, posn, lastPosn) => {
      if (e.propagateToTool) this.state.tool.handleDragStart(e, posn, lastPosn);
      this.canvas.refresh('tool');
      this.canvas.refresh('ui');
    });

    this.cursorHandler.on('drag', (e, posn, lastPosn) => {
      if (e.propagateToTool) this.state.tool.handleDrag(e, posn, lastPosn);
      this.canvas.refresh('tool');
      this.canvas.refresh('ui');
    });

    this.cursorHandler.on('drag:stop', (e, posn, startPosn) => {
      if (e.propagateToTool) this.state.tool.handleDragStop(e, posn, startPosn);
      this.canvas.refresh('tool');
      this.canvas.refresh('ui');
    });

    this.cursorHandler.on('scroll:x', (e, delta) => {
      if (this.state.tool.id === 'zoom') {
      } else {
        this.nudge(this.projection.zInvert(delta), 0);
      }
    });

    this.cursorHandler.on('scroll:y', (e, delta) => {
      if (this.state.tool.id === 'zoom') {
        let zd = 1-(delta / 1000);
        let anchor = this.cursor.lastPosn;
        this.setZoom(this.state.zoomLevel*zd, anchor);
      } else {
        this.nudge(0, this.projection.zInvert(delta));
      }
    });

    hotkeys.on('down', 'downArrow', () => { this.nudgeSelected(0, 1); });
    hotkeys.on('down', 'upArrow', () => { this.nudgeSelected(0, -1); });
    hotkeys.on('down', 'leftArrow', () => { this.nudgeSelected(-1, 0); });
    hotkeys.on('down', 'rightArrow', () => { this.nudgeSelected(1, 0); });
    hotkeys.on('down', 'shift-downArrow', () => { this.nudgeSelected(0, 10); });
    hotkeys.on('down', 'shift-rightArrow', () => { this.nudgeSelected(10, 0); });
    hotkeys.on('down', 'shift-upArrow', () => { this.nudgeSelected(0, -10); });
    hotkeys.on('down', 'shift-leftArrow', () => { this.nudgeSelected(-10, 0); });

    hotkeys.on('down', 'V', () => { this.selectTool(new Cursor(this)); });
    hotkeys.on('down', 'A', () => { this.selectTool(new SubCursor(this)); });
    hotkeys.on('down', 'Z', () => { this.selectTool(new Zoom(this)); });
    hotkeys.on('down', 'P', () => { this.selectTool(new Pen(this)); });
    hotkeys.on('down', 'space', () => { this.selectTool(new Paw(this)); });
    hotkeys.on('up', 'space', () => { this.selectTool(this.state.lastTool); });

    hotkeys.on('down', 'ctrl-A', (e) => {
      e.preventDefault();
      this.selectAll();
    });

    hotkeys.on('down', '1', () => {
      let center = this.doc.bounds.center();
      this.setPosition(center);
      this.setZoom(1);
    });
    hotkeys.on('down', '+', () => { this.zoomIn(); });
    hotkeys.on('down', '-', () => { this.zoomOut(); });

    hotkeys.on('down', 'backspace', () => { this.deleteSelection(); });

    hotkeys.on('down', 'ctrl-Z', () => { 
      this.undo();
    });
    hotkeys.on('down', 'ctrl-shift-Z', () => {
      this.redo();
    });

    /*
    hotkeys.on('down', 'ctrl-V', () => { 
      this.paste();
    });
    */

    document.addEventListener('copy', (e) => { this.copy(e) });
    document.addEventListener('paste', (e) => { this.paste(e) });

    this.canvas.refreshAll();
  }

  initState() {
    let cached = sessionStorage.getItem('editor:state');
    if (cached) {
      cached = JSON.parse(cached);
      this.state = {
        zoomLevel: cached.zoomLevel,
        position: new Posn(cached.position),
        selection: [],
        hovering:  [],
        scope: new Index([0]),
        tool: new Cursor(this)
      }
    } else {
      this.state = {
        zoomLevel: 1,
        selection: [],
        hovering:  [],
        scope: new Index([0]),
        tool: new Cursor(this)
      };

    }
  }

  cacheState() {
    sessionStorage.setItem('editor:state', JSON.stringify({
      zoomLevel: this.state.zoomLevel,
      position: this.state.position
    }));
  }

  setPosition(posn) {
    this.state.position = posn;
    if (this.doc) {
      this.calculateScales();
    }
    this.canvas.refreshAll();
    this.cacheState();
  }

  nudge(x, y) {
    this.setPosition(this.state.position.nudge(x, y));
  }

  zoomIn() {
    this.setZoom(this.state.zoomLevel*1.2);
  }

  zoomOut() {
    this.setZoom(this.state.zoomLevel*0.8);
  }

  setZoom(zl, anchor=null) {

    zl = Math.min(100, Math.max(0.01, zl));

    this.state.zoomLevel = zl;

    let anchorBefore;
    if (anchor) {
      anchorBefore = this.projection.posnInvert(anchor);
    }

    if (this.doc) {
      this.calculateScales();
    }

    if (anchorBefore) {
      // Correct position to maintain anchor point
      let anchorAfter = this.projection.posnInvert(anchor);
      let xd = anchorAfter.x - anchorBefore.x;
      let yd = anchorAfter.y - anchorBefore.y;
      this.nudge(-xd, -yd);
    }

    this.canvas.refreshAll();
    this.cacheState();
  }

  clearSelection() {
    this.setSelection([]);
  }

  selectAll() {
    this.setSelection(this.doc.elements.slice(0));
  }

  flattenGroupItems(items) {
    let finalItems = [];
    for (let item of items) {
      if ((item instanceof Path) || (item instanceof PathPoint)) {
        finalItems.push(item);
      } else if (item instanceof PointsSegment) {
        // Reduce PointsSegments to just the contained PathPoints
        finalItems = finalItems.concat(item.points);
      } else if ((item instanceof Group) || (item instanceof Layer)) {
        finalItems = finalItems.concat(item.childrenFlat);
      }
    }
    return finalItems;
  }

  setSelection(items) {
    let flatItems = this.flattenGroupItems(items);
    this.state.selection = flatItems;

    if (flatItems[0] instanceof PathPoint) {
      this.state.selectionType = 'POINTS';
    } else {
      this.state.selectionType = 'ELEMENTS';
    }

    // DEBUG
    window.$s = items;

    this.calculateSelectionBounds();

    this.canvas.refreshAll();
    this.trigger('change');
    this.trigger('change:selection');
  }

  setHovering(items) {
    let flatItems = this.flattenGroupItems(items);
    this.state.hovering = flatItems;

    if (flatItems[0] instanceof PathPoint) {
      this.state.hoveringType = 'POINTS';
    } else {
      this.state.hoveringType = 'ELEMENTS';
    }

    this.canvas.refreshAll();
    this.trigger('change');
    this.trigger('change:hovering');
  }

  isSelected(item) {
    if (item instanceof Group) {
      let isSelected = true;
      for (let child of item.children) {
        isSelected = isSelected && this.isSelected(child);
        if (!isSelected) break;
      }
      return isSelected;
    } else if (item instanceof Layer) {
      return this.state.layer === item;
    } else {
      return this.state.selection.indexOf(item) > -1;
    }
  }

  setCurrentLayer(layer) {
    this.state.layer = layer;

    this.canvas.refreshAll();
    this.trigger('change');
    this.trigger('change:layer');
  }

  selectTool(tool) {
    if (tool.constructor !== this.state.tool.constructor) {
      this.state.lastTool = this.state.tool;
    }
    this.state.tool = tool;
    this.canvas.refreshAll();
  }

  deleteSelection() {
    if (this.state.selection.length === 0) {
      return;
    }

    let action = new actions.DeleteAction({ 
      items: this.state.selection.slice(0).map((item) => {
        return { item, index: item.index }
      })
    });

    this.perform(action);

    this.cleanUpEmptyItems(action);

    this.setSelection([]);
    this.canvas.refreshAll();

    this.calculateSelectionBounds();
    this.trigger('change');
  }

  insertElements(elems) {
    let items = [];
    let parent = this.doc.getFromIndex(this.state.scope);
    let nextIndex = parent.nextChildIndex();

    for (let item of elems) {
      items.push({ item, index: nextIndex });
      nextIndex.plus(1);
    }

    let action = new actions.InsertAction({ items });

    this.perform(action);
  }

  calculateSelectionBounds() {
    let selectionBounds = {};

    if (this.state.selection.length > 0) {
      let bounds;
      let angle = 0;
      let center;

      if (this.state.selectionType === 'ELEMENTS') {
        let selectedAngles = _.uniq(this.state.selection.map((e) => { return e.metadata.angle }));
        if (selectedAngles.length === 1) {
          angle = selectedAngles[0];
        }

        let boundsList = [];

        for (let elem of this.state.selection) {
          if (angle !== 0) {
            elem.rotate(-angle, new Posn(0,0));
          }
          boundsList.push(elem.bounds());
          if (angle !== 0) {
            elem.rotate(angle, new Posn(0,0));
          }
        }

        bounds = new Bounds(boundsList);
        center = bounds.center();

      } else if (this.state.selectionType === 'POINTS') {
        let selectedAngles = _.uniq(this.state.selection.map((e) => { return e.path.metadata.angle }));
        if (selectedAngles.length === 1) {
          angle = selectedAngles[0];
        }

        if (angle !== 0) {
          for (let pt of this.state.selection) {
            pt.rotate(-angle, new Posn(0, 0));
          }
        }
        bounds = Bounds.fromPosns(this.state.selection);
        if (angle !== 0) {
          for (let pt of this.state.selection) {
            pt.rotate(angle, new Posn(0, 0));
          }
        }

        center = bounds.center();
      }

      if (angle) {
        center = center.rotate(angle, new Posn(0,0));
        bounds.centerOn(center);
        bounds.angle = angle;
      }

      selectionBounds.bounds = bounds;
      selectionBounds.angle = angle;
      selectionBounds.center = center;
    }

    this.state.selectionBounds = selectionBounds;
  }

  selectedIndexes() {
    return this.state.selection.map((item) => {
      return item.index;
    }).filter((index) => {
      if (index === null) {
        console.warn('null index in history!');
        return false;
      } else {
        return true;
      }
    });
  }

  selectFromIndexes(indexes) {
    let sel = indexes.map((index) => {
      return this.doc.getFromIndex(index);
    });

    this.setSelection(sel);
  }

  refreshDrawing(layer, context) {
    if (this.doc) {
      this.doc.drawToCanvas(layer, context, this.projection);
    }
  }

  calculateScales() {
    // Calculate scales
    let offsetLeft = (this.canvas.width - (this.doc.width*this.state.zoomLevel)) / 2;
    offsetLeft += ((this.doc.width/2)-this.state.position.x)*this.state.zoomLevel;
    let offsetTop  = (this.canvas.height - (this.doc.height*this.state.zoomLevel)) / 2;
    offsetTop += ((this.doc.height/2)-this.state.position.y)*this.state.zoomLevel;

    // Account for windows on right side
    offsetLeft -= 200;

    let x = scaleLinear()
      .domain([0, this.doc.width])
      .range([offsetLeft, offsetLeft + (this.doc.width*this.state.zoomLevel)]);

    let y = scaleLinear()
      .domain([0, this.doc.height])
      .range([offsetTop, offsetTop + (this.doc.height*this.state.zoomLevel)]);

    this.projection = new Projection(x, y, this.state.zoomLevel);

    this.cursorHandler.projection = this.projection;
  }

  docBounds() {
    return new Bounds(0,0,this.doc.width,this.doc.height);
  }

  screenBounds() {
    return this.projection.bounds(new Bounds(0,0,this.doc.width,this.doc.height));
  }

  refreshBackground(layer, context) {
    layer.setFill(consts.bgGrey);
    context.fillRect(0, 0, layer.width, layer.height);

    // Draw white background
    if (this.doc) {
      let bounds = this.screenBounds();
      layer.drawRect(bounds, { fill: new Color('#ffffff') });
    }
  }

  nudgeSelected(xd, yd) {
    if (this.state.selection.length === 0) {
      return;
    }

    let action = new actions.NudgeAction({
      indexes: this.selectedIndexes(),
      xd, yd,
    });

    this.perform(action);

    this.calculateSelectionBounds();
    this.canvas.refreshAll();

    this.trigger('change');
  }

  nudgeHandle(index, handle, xd, yd) {
    if (this.state.selection.length === 0) {
      return;
    }

    let action = new actions.NudgeHandleAction({
      indexes: [index], xd, yd, handle,
    });

    this.perform(action);

    this.calculateSelectionBounds();
    this.canvas.refreshAll();

    this.trigger('change');
  }

  scaleSelected(x, y, origin) {
    if (this.state.selection.length === 0) {
      return;
    }

    let action = new actions.ScaleAction({
      indexes: this.selectedIndexes(),
      x, y, origin,
    });

    this.perform(action);

    this.calculateSelectionBounds();
    this.canvas.refreshAll();

    this.trigger('change');
  }

  rotateSelected(angle, origin) {
    if (this.state.selection.length === 0) {
      return;
    }

    let action = new actions.RotateAction({
      indexes: this.selectedIndexes(),
      a: angle,
      origin
    });

    this.perform(action);

    this.calculateSelectionBounds();
    this.canvas.refreshAll();

    this.trigger('change');
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

  cleanUpEmptyItems(action) {
    let markedForRemoval = [];
    for (let pair of action.data.items) {
      let { index, item } = pair;

      let toRemove;
      let parent = item;

      while (true) {
        let index = parent.index;
        let nextParent = this.doc.getFromIndex(index.parent);
        if (!nextParent) break;

        // We don't remove empty layers;
        if (nextParent instanceof Layer) break;

        if (nextParent.empty) {
          toRemove = nextParent;
          parent = nextParent;
        } else {
          break;
        }
      }

      if (toRemove && markedForRemoval.indexOf(toRemove) === -1) {
        markedForRemoval.push(toRemove);
      }
    }

    if (markedForRemoval.length > 0) {
      let cleanUpAction = new actions.DeleteAction({
        items: markedForRemoval.map((item) => {
          return { item, index: item.index }
        })
      });

      this.perform(cleanUpAction);
    }
  }

  undo() {
    this.history.undo(this);
    this.calculateSelectionBounds();
    this.canvas.refreshAll();
    this.trigger('change');
  }

  redo() {
    this.history.redo(this);
    this.calculateSelectionBounds();
    this.canvas.refreshAll();
    this.trigger('change');
  }

  copy(e) {
    this.state.clipboard = this.state.selection.map((e) => { return e.clone() });
  }

  paste(e) {
    if (this.state.clipboard) {
      this.insertElements(this.state.clipboard);
    }
  }

  refreshTool(layer, context) {
    this.state.tool.refresh(layer, context);
  }


}
