import { scaleLinear } from 'd3-scale';
import Canvas from 'ui/canvas';
import Posn from 'geometry/posn';
import Projection from 'ui/projection';
import hotkeys from 'ui/hotkeys';
import Bounds from 'geometry/bounds'
import Element from 'ui/element';
import CursorHandler from 'ui/cursor-handler';
import DocHistory from 'history/history';
import { NudgeEvent, ScaleEvent, DeleteEvent } from 'history/events';

import Cursor from 'ui/tools/cursor';
import Zoom from 'ui/tools/zoom';
import Paw from 'ui/tools/paw';

import transformer from 'ui/editor/transformer';


export default class Editor {
  constructor(rootSelector) {

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

    this.setPosition(this.doc.center());

    this.canvas.refreshAll();
  }

  initCanvas() {
    console.log(this.root, this.root.offsetHeight);
    this.canvas = new Canvas(this.root);

    this.cursor = new CursorHandler(this.canvas.cursor);

    this.canvas.createLayer('background', this.refreshBackground.bind(this));
    this.canvas.createLayer('drawing', this.refreshDrawing.bind(this));
    this.canvas.createLayer('tool', this.refreshTool.bind(this));
    this.canvas.createLayer('transformer', transformer.refresh.bind(this));
    this.canvas.createLayer('border', this.refreshBorder.bind(this));
    this.canvas.createLayer('debug', () => {});

    this.cursor.on('mousemove', (e, posn) => {
      if (e.propagateToTool) this.state.tool.handleMousemove(e, posn);
      this.canvas.refresh('tool');
      this.canvas.refresh('transformer');
    });

    this.cursor.on('mousedown', (e, posn) => {
      if (e.propagateToTool) this.state.tool.handleMousedown(e, posn);
      this.canvas.refresh('tool');
      this.canvas.refresh('transformer');
    });

    this.cursor.on('click', (e, posn) => {
      if (e.propagateToTool) this.state.tool.handleClick(e, posn);
      this.canvas.refresh('tool');
      this.canvas.refresh('transformer');
    });

    this.cursor.on('drag:start', (e, posn, lastPosn) => {
      if (e.propagateToTool) this.state.tool.handleDragStart(e, posn, lastPosn);
      this.canvas.refresh('tool');
      this.canvas.refresh('transformer');
    });

    this.cursor.on('drag', (e, posn, lastPosn) => {
      if (e.propagateToTool) this.state.tool.handleDrag(e, posn, lastPosn);
      this.canvas.refresh('tool');
      this.canvas.refresh('transformer');
    });

    this.cursor.on('drag:stop', (e, posn, startPosn) => {
      if (e.propagateToTool) this.state.tool.handleDragStop(e, posn, startPosn);
      this.canvas.refresh('tool');
      this.canvas.refresh('transformer');
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
    hotkeys.on('down', 'Z', () => { this.selectTool(new Zoom(this)); });
    hotkeys.on('down', 'space', () => { this.selectTool(new Paw(this)); });
    hotkeys.on('up', 'space', () => { this.selectTool(this.state.lastTool); });

    hotkeys.on('down', 'ctrl-A', () => { this.selectAll(); });

    hotkeys.on('down', '1', () => {
      let center = this.doc.bounds.center();
      this.setPosition(center);
      this.setZoom(1);
    });
    hotkeys.on('down', '+', () => { this.zoomIn(); });
    hotkeys.on('down', '-', () => { this.zoomOut(); });

    hotkeys.on('down', 'backspace', () => { this.deleteSelection(); });

    hotkeys.on('down', 'ctrl-Z', () => { 
      this.history.undo(this);
      this.canvas.refreshAll();
    });
    hotkeys.on('down', 'ctrl-shift-Z', () => {
      this.history.redo(this);
      this.canvas.refreshAll();
    });

    this.canvas.updateDimensions();

    this.canvas.refreshAll();
  }

  initState() {
    this.state = {
      zoomLevel: 1,
      selection: [],
      tool: new Cursor(this)
    };
  }

  setPosition(posn) {
    this.position = posn;
    if (this.doc) {
      this.calculateScales();
    }
    this.canvas.refreshAll();
  }

  nudge(x, y) {
    this.setPosition(this.position.nudge(x, y));
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
  }

  clearSelection() {
    this.state.selection = [];
  }

  selectAll() {
    this.state.selection = this.doc.elements.slice(0);
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
    console.log(indexes);
    this.state.selection = [];
    delete this.state.hovering;
    this.canvas.refreshAll();

    let event = new DeleteEvent({
      elements,
      indexes
    });
    this.history.push(event);
  }

  selectionBounds() {
    let boundsList = [];

    for (let elem of this.state.selection) {
      boundsList.push(elem.bounds());
    }

    return new Bounds(boundsList);
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
    offsetLeft += ((this.doc.width/2)-this.position.x)*this.state.zoomLevel;
    let offsetTop  = (this.canvas.height - (this.doc.height*this.state.zoomLevel)) / 2;
    offsetTop += ((this.doc.height/2)-this.position.y)*this.state.zoomLevel;

    let x = scaleLinear()
      .domain([0, this.doc.width])
      .range([offsetLeft, offsetLeft + (this.doc.width*this.state.zoomLevel)]);

    let y = scaleLinear()
      .domain([0, this.doc.height])
      .range([offsetTop, offsetTop + (this.doc.height*this.state.zoomLevel)]);

    this.projection = new Projection(x, y, this.state.zoomLevel);

    this.cursor.projection = this.projection;
  }

  docBounds() {
    return new Bounds(0,0,this.doc.width,this.doc.height);
  }

  screenBounds() {
    return this.projection.bounds(new Bounds(0,0,this.doc.width,this.doc.height));
  }

  refreshBackground(layer, context) {
    context.fillStyle = 'white';
    context.fillRect(0, 0, layer.width, layer.height);

    // Draw white background
    if (this.doc) {
      let bounds = this.screenBounds();
      layer.drawRect(bounds, { fill: 'white' });
    }
  }

  refreshBorder(layer, context) {
    if (this.doc) {
      let bounds = this.screenBounds().sharp();
      layer.drawRect(bounds, { stroke: 'black' });
    }

    let w = this.canvas.width;
    let h = this.canvas.height;
    layer.drawLineSegment(new Posn(0, 0), new Posn(w, 0), {
      stroke: 'rgba(0,0,0,0.5)'
    });

    layer.drawLineSegment(new Posn(0, 0), new Posn(0, h), {
      stroke: 'rgba(0,0,0,0.5)'
    });
  }

  nudgeSelected(x, y) {
    for (let elem of this.state.selection) {
      elem.nudge(x,y);
    }
    this.canvas.refreshAll();

    // Record history event
    let event = new NudgeEvent({
      ids: this.selectionIds(),
      xd: x,
      yd: y,
    });
    this.history.push(event);
  }

  scaleSelected(x, y, origin, historyOpts={}) {
    for (let elem of this.state.selection) {
      elem.scale(x, y, origin);
    }
    this.canvas.refreshAll();

    let event = new ScaleEvent({
      ids: this.selectionIds(),
      origin,
      x,
      y,
    });

    this.history.push(event);

  }

  refreshTool(layer, context) {
    this.state.tool.refresh(layer, context);
  }


}
