import { scaleLinear } from 'd3-scale';
import Canvas from 'ui/canvas';
import Posn from 'geometry/posn';
import Projection from 'ui/projection';
import hotkeys from 'ui/hotkeys';
import Bounds from 'geometry/bounds'

import Cursor from 'ui/tools/cursor';
import Paw from 'ui/tools/paw';


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
    window.doc = doc;

    this.setPosition(this.doc.center());
    //this.setPosition({x:0,y:0});

    this.canvas.refreshAll();
  }

  initCanvas() {
    this.canvas = new Canvas(this.root);

    this.canvas.createLayer('background', this.refreshBackground.bind(this));
    this.canvas.createLayer('drawing', this.refreshDrawing.bind(this));
    this.canvas.createLayer('tool', this.refreshTool.bind(this));
    this.canvas.createLayer('border', this.refreshBorder.bind(this));
    this.canvas.createLayer('debug', () => {});

    this.canvas.cursor.on('mousemove', (e, posn) => {
      this.state.tool.handleMousemove(posn);
      this.canvas.refresh('tool');
    });

    this.canvas.cursor.on('mousedown', (e, posn) => {
      this.state.tool.handleMousedown(posn);
      this.canvas.refresh('tool');
    });

    this.canvas.cursor.on('click', (e, posn) => {
      this.state.tool.handleClick(posn);
      this.canvas.refresh('tool');
    });

    this.canvas.cursor.on('drag:start', (e, posn) => {
      this.state.tool.handleDragStart(posn);
      this.canvas.refresh('tool');
    });

    this.canvas.cursor.on('drag', (e, posn, lastPosn) => {
      this.state.tool.handleDrag(posn, lastPosn);
      this.canvas.refresh('tool');
    });

    this.canvas.cursor.on('drag:stop', (e, posn, lastPosn) => {
      this.state.tool.handleDragStop(posn, lastPosn);
      this.canvas.refresh('tool');
    });


    hotkeys.on('down', 'downArrow', () => { this.nudgeSelected(0, 1); });
    hotkeys.on('down', 'upArrow', () => { this.nudgeSelected(0, -1); });
    hotkeys.on('down', 'leftArrow', () => { this.nudgeSelected(-1, 0); });
    hotkeys.on('down', 'rightArrow', () => { this.nudgeSelected(1, 0); });

    hotkeys.on('down', 'space', () => { this.selectTool(new Paw(this)); });
    hotkeys.on('up', 'space', () => { this.selectTool(this.state.lastTool); });

    hotkeys.on('down', '+', () => { this.zoomIn(); });
    hotkeys.on('down', '-', () => { this.zoomOut(); });

    hotkeys.on('down', 'backspace', () => { this.deleteSelection(); });

    this.canvas.updateDimensions();

    this.canvas.refreshAll();
  }

  initState() {
    this.state = {
      zoomLevel: 1.22,
      selection: [],
      tool: new Cursor(this)
    };
  }

  setPosition(posn) {
    this.position = posn;
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
    this.canvas.refreshAll();
  }

  selectTool(tool) {
    if (tool.constructor !== this.state.tool.constructor) {
      this.state.lastTool = this.state.tool;
    }
    this.state.tool = tool;
    this.canvas.refreshAll();
  }

  deleteSelection() {
    for (let elem of this.state.selection) {
      this.doc.remove(elem);
    }
    this.state.selection = [];
    delete this.state.hovering;
    this.canvas.refreshAll();
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
    this.projectionSharp = new Projection(x, y, this.state.zoomLevel, true);
  }

  docBounds() {
    return this.projection.bounds(new Bounds(0,0,this.doc.width,this.doc.height));
  }

  refreshBackground(layer, context) {
    if (this.doc) {
      this.calculateScales();
    }

    context.fillStyle = 'lightgrey';
    context.fillRect(0, 0, layer.width, layer.height);

    // Draw white background
    if (this.doc) {
      let bounds = this.docBounds();
      layer.drawRect(bounds, { fill: 'white' });
    }
  }

  refreshBorder(layer, context) {
    if (this.doc) {
      let bounds = this.docBounds();
      layer.drawRect(bounds, { stroke: 'black' });
    }
  }

  nudgeSelected(x,y) {
    for (let elem of this.state.selection) {
      elem.nudge(x,y);
    }
    this.canvas.refreshAll();
  }

  refreshTool(layer, context) {
    this.state.tool.refresh(layer, context);
  }


}
