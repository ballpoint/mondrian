import { scaleLinear } from 'd3-scale';
import Canvas from 'ui/canvas';
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

    hotkeys.on('down', 'downArrow', () => { this.nudgeSelected(0, 1); });
    hotkeys.on('down', 'upArrow', () => { this.nudgeSelected(0, -1); });
    hotkeys.on('down', 'leftArrow', () => { this.nudgeSelected(-1, 0); });
    hotkeys.on('down', 'rightArrow', () => { this.nudgeSelected(1, 0); });

    hotkeys.on('down', 'space', () => { this.selectTool(new Paw(this)); });
    hotkeys.on('up', 'space', () => { this.selectTool(this.state.lastTool); });

    this.canvas.updateDimensions();

    this.canvas.refreshAll();
  }

  initState() {
    this.state = {
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

  selectTool(tool) {
    this.state.lastTool = this.state.tool;
    this.state.tool = tool;
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
    this.state.zoomLevel = 1.2;
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

      this.zScale = (n) => { return n * this.state.zoomLevel };
    }

    context.fillStyle = 'lightgrey';
    context.fillRect(0, 0, layer.width, layer.height);

    if (this.doc) {
      context.fillStyle = 'white';
      context.strokeStyle = 'black';
      context.fillRect(this.x(0), this.y(0), this.doc.width*this.state.zoomLevel, this.doc.height*this.state.zoomLevel);
      context.strokeRect(this.x(0), this.y(0), this.doc.width*this.state.zoomLevel, this.doc.height*this.state.zoomLevel);
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
