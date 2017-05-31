import { PIXEL_RATIO } from 'lib/math';
import { scaleLinear } from 'd3-scale';
import consts from 'consts';
import Color from 'ui/color';
import EventEmitter from 'lib/events';
import math from 'lib/math';
import Canvas from 'ui/canvas';
import Posn from 'geometry/posn';
import Point from 'geometry/point';
import Projection from 'ui/projection';
import hotkeys from 'ui/hotkeys';
import Bounds from 'geometry/bounds'
import Element from 'ui/element';
import CursorTracking from 'ui/cursor-tracking';
import CursorHandler from 'ui/cursor-handler';
import DocHistory from 'history/history';
import { NudgeEvent, ScaleEvent, DeleteEvent } from 'history/events';

import Cursor from 'ui/tools/cursor';
import SubCursor from 'ui/tools/subcursor';
import Zoom from 'ui/tools/zoom';
import Paw from 'ui/tools/paw';

const RULER_DIMEN = math.sharpen(20);

import transformer from 'ui/editor/transformer';


export default class Editor extends EventEmitter {
  constructor(rootSelector) {
    super();

    let root = document.querySelector(rootSelector);
    if (root) {
      this.root = root;
      this.initState();
      this.initCanvas();
    } else {
      throw new Error('root not found: ' + rootSelector);
    }
  }

  load(doc) {
    this.doc = doc;

    this.history = new DocHistory();
    window.h = this.history;

    this.setPosition(doc.center());

    this.canvas.refreshAll();
  }

  initCanvas() {
    console.log(this.root, this.root.offsetHeight);
    this.canvas = new Canvas(this.root);

    this.cursor = new CursorTracking(this.root);

    this.cursorHandler = new CursorHandler(this.cursor);

    this.canvas.createLayer('background', this.refreshBackground.bind(this));
    this.canvas.createLayer('drawing', this.refreshDrawing.bind(this));
    this.canvas.createLayer('tool', this.refreshTool.bind(this));
    this.canvas.createLayer('transformer', transformer.refresh.bind(this));
    this.canvas.createLayer('guides', this.refreshGuides.bind(this));
    this.canvas.createLayer('debug', () => {});

    this.cursorHandler.on('mousemove', (e, posn) => {
      if (e.propagateToTool) this.state.tool.handleMousemove(e, posn);
      this.canvas.refresh('tool');
      this.canvas.refresh('transformer');
    });

    this.cursorHandler.on('mousedown', (e, posn) => {
      if (e.propagateToTool) this.state.tool.handleMousedown(e, posn);
      this.canvas.refresh('tool');
      this.canvas.refresh('transformer');
    });

    this.cursorHandler.on('click', (e, posn) => {
      if (e.propagateToTool) this.state.tool.handleClick(e, posn);
      this.canvas.refresh('tool');
      this.canvas.refresh('transformer');
    });

    this.cursorHandler.on('drag:start', (e, posn, lastPosn) => {
      if (e.propagateToTool) this.state.tool.handleDragStart(e, posn, lastPosn);
      this.canvas.refresh('tool');
      this.canvas.refresh('transformer');
    });

    this.cursorHandler.on('drag', (e, posn, lastPosn) => {
      if (e.propagateToTool) this.state.tool.handleDrag(e, posn, lastPosn);
      this.canvas.refresh('tool');
      this.canvas.refresh('transformer');
    });

    this.cursorHandler.on('drag:stop', (e, posn, startPosn) => {
      if (e.propagateToTool) this.state.tool.handleDragStop(e, posn, startPosn);
      this.canvas.refresh('tool');
      this.canvas.refresh('transformer');
    });

    this.cursorHandler.on('scroll:y', (e, delta) => {
      let zd = 1-(delta / 1000);
      this.setZoom(this.state.zoomLevel*zd);
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

    hotkeys.on('down', 'ctrl-V', () => { 
      this.paste();
    });

    document.addEventListener('copy', (e) => { this.copy(e) });
    document.addEventListener('paste', (e) => { this.paste(e) });

    this.canvas.updateDimensions();

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
        tool: new Cursor(this)
      }
    } else {
      this.state = {
        zoomLevel: 1,
        selection: [],
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

  setZoom(zl) {
    this.state.zoomLevel = zl;
    if (this.doc) {
      this.calculateScales();
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

  setSelection(items) {
    this.state.selection = items;

    if (items[0] instanceof Point) {
      this.state.selectionType = 'POINTS';
    } else {
      this.state.selectionType = 'ELEMENTS';
    }

    // DEBUG
    window.$s = items;

    this.calculateSelectionBounds();

    this.canvas.refreshAll();
    this.trigger('change');
  }

  selectTool(tool) {
    if (tool.constructor !== this.state.tool.constructor) {
      this.state.lastTool = this.state.tool;
    }
    this.state.tool = tool;
    this.canvas.refreshAll();
  }

  deleteSelection() {
    let indexes = {};
    let elements = [];
    for (let elem of this.state.selection) {
      let index = this.doc.remove(elem);
      indexes[elem.id] = index;
      elements.push(elem);
    }
    this.state.selection = [];
    this.canvas.refreshAll();

    let event = new DeleteEvent({
      elements,
      indexes
    });
    this.history.push(event);

    this.calculateSelectionBounds();
    this.trigger('change');
  }

  calculateSelectionBounds() {
    if (this.state.selection.length > 0) {

      if (this.state.selection[0] instanceof Point) {
        this.state.selectionBounds = Bounds.fromPosns(this.state.selection);
      } else {
        let boundsList = [];

        for (let elem of this.state.selection) {
          boundsList.push(elem.bounds());
        }

        this.state.selectionBounds = new Bounds(boundsList);
      }
    } else {
      this.state.selectionBounds = null;
    }
  }

  selectionIds() {
    return this.state.selection.map((elem) => {
      return elem.id;
    }).filter((id) => {
      return !!id;
    });
  }

  refreshDrawing(layer, context) {
    if (this.doc) {
      for (let elem of this.doc.elements) {
        elem.drawToCanvas(context, this.projection);
      }
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

  refreshGuides(layer, context) {
    layer.setLineWidth(1);

    let docBounds;

    if (this.doc) {
      docBounds = this.screenBounds().sharp();
      layer.drawRect(docBounds, { stroke: 'black' });
    }

    // Draw ruler
    layer.drawRect(new Bounds(-1, -1, 21, 21).sharp(), { fill: '#ffffff' });
    layer.drawRect(new Bounds(20, -1, this.canvas.width, 21).sharp(), { fill: '#ffffff' });
    layer.drawRect(new Bounds(-1, 20, 21, this.canvas.height).sharp(), { fill: '#ffffff' });
    layer.drawLineSegment(
      { x: -1, y: RULER_DIMEN  },
      { x: this.canvas.width, y: RULER_DIMEN  },
      { stroke: '#c9c9c9' }
    );
    layer.drawLineSegment(
      { x: RULER_DIMEN  , y: -1 },
      { x: RULER_DIMEN  , y: this.canvas.height },
      { stroke: '#c9c9c9' }
    );

    for (let x = math.roundTo(this.projection.xInvert(RULER_DIMEN), 100); x < this.projection.xInvert(this.canvas.width); x += 100) {
      this.drawRulerXTick(layer, x);
    }

    for (let y = math.roundTo(this.projection.yInvert(RULER_DIMEN), 100); y < this.projection.yInvert(this.canvas.height); y += 100) {
      this.drawRulerYTick(layer, y);
    }
  }

  drawRulerXTick(layer, xval) {
    let x = this.projection.x(xval);
    layer.drawLineSegment(
      { x, y: RULER_DIMEN - 10 },
      { x, y: RULER_DIMEN },
      { stroke: '#000000' }
    );
  }

  drawRulerYTick(layer, yval) {
    let y = this.projection.y(yval);
    layer.drawLineSegment(
      { x: RULER_DIMEN - 10, y },
      { x: RULER_DIMEN, y },
      { stroke: '#000000' }
    );
  }

  nudgeSelected(x, y) {
    for (let item of this.state.selection) {
      item.nudge(x,y);
    }
    this.calculateSelectionBounds();
    this.canvas.refreshAll();

    // Record history event
    let event = new NudgeEvent({
      ids: this.selectionIds(),
      xd: x,
      yd: y,
    });
    this.history.push(event);
    this.trigger('change');
  }

  scaleSelected(x, y, origin) {
    for (let elem of this.state.selection) {
      elem.scale(x, y, origin);
    }
    this.calculateSelectionBounds();
    this.canvas.refreshAll();

    let event = new ScaleEvent({
      ids: this.selectionIds(),
      origin,
      x,
      y,
    });

    this.history.push(event);
    this.trigger('change');
  }

  rotateSelected(angle, origin) {
    for (let elem of this.state.selection) {
      elem.rotate(angle, origin);
    }

    //this.calculateSelectionBounds();
    this.canvas.refreshAll();
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
    console.log(this.state.clipboard);
    for (let elem of this.state.clipboard) {
      this.doc.insertElement(elem);
    }
    this.setSelection(this.state.clipboard);
    this.state.cl
  }

  refreshTool(layer, context) {
    this.state.tool.refresh(layer, context);
  }


}
