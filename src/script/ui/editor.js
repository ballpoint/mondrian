import { scaleLinear } from 'd3-scale';
import Canvas from 'ui/canvas';
import Posn from 'geometry/posn';
import hotkeys from 'ui/hotkeys';
import math from 'lib/math';

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

    this.canvas.createLayer('viewport', this.refreshViewport.bind(this));
    this.canvas.createLayer('drawing', this.refreshDrawing.bind(this));
    this.canvas.createLayer('tool', this.refreshTool.bind(this));

    this.canvas.cursor.on('mousemove', (e, posn) => {
      this.state.tool.handleMousemove(posn);
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
      zoomLevel: 1,
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
        elem.drawToCanvas(context, {
          x: this.x, y: this.y
        });
      }
    }
  }

  refreshViewport(layer, context) {
    if (this.doc) {

      let offsetLeft = (this.canvas.width - (this.doc.width*this.state.zoomLevel)) / 2;
      offsetLeft += ((this.doc.width/2)-this.position.x)*this.state.zoomLevel;
      let offsetTop  = (this.canvas.height - (this.doc.height*this.state.zoomLevel)) / 2;
      offsetTop += ((this.doc.height/2)-this.position.y)*this.state.zoomLevel;

      this.x = scaleLinear()
        .domain([0, this.doc.width])
        .range([offsetLeft, offsetLeft + (this.doc.width*this.state.zoomLevel)]);

      this.xSharp = (n) => { return math.sharpen(this.x(n)) };

      this.y = scaleLinear()
        .domain([0, this.doc.height])
        .range([offsetTop, offsetTop + (this.doc.height*this.state.zoomLevel)]);

      this.ySharp = (n) => { return math.sharpen(this.y(n)) };

      this.docPosn = (p) => { return new Posn(this.x.invert(p.x), this.y.invert(p.y)) }

      this.zScale = (n) => { return n * this.state.zoomLevel };
    }

    context.fillStyle = 'lightgrey';
    context.fillRect(0, 0, layer.width, layer.height);

    let dx = this.xSharp(0);
    let dy = this.ySharp(0);
    let dw = Math.round(this.zScale(this.doc.width));
    let dh = Math.round(this.zScale(this.doc.height));

    if (this.doc) {
      context.fillStyle = 'white';
      context.strokeStyle = 'black';
      context.fillRect(dx, dy, dw, dh);
      context.strokeRect(dx, dy, dw, dh);
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
