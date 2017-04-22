import { scaleLinear } from 'd3-scale';
import Canvas from 'ui/canvas';
import shapes from 'lab/shapes';
import hotkeys from 'ui/hotkeys';
import math from 'lib/math';

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
    this.canvas.createLayer('objects', this.refreshObjects.bind(this));

    this.canvas.cursor.on('mousemove', (e, posn) => {
      this.handleMouseMove();
      if (!this.canvas.cursor.dragging) {
        this.canvas.refresh('objects');
      }
    });

    this.canvas.cursor.on(['click', 'drag:start'], (e, posn) => {
      if (this.state.hovering) {
        this.state.selection = [this.state.hovering];
      } else {
        delete this.state.selection;
      }
      this.canvas.refresh('objects');
    });


    this.canvas.cursor.on('drag', (e, posn, lastPosn) => {
      let xd = posn.x - lastPosn.x;
      let yd = posn.y - lastPosn.y;

      xd /= this.state.zoomLevel;
      yd /= this.state.zoomLevel;

      this.nudgeSelected(xd, yd);
    });

    hotkeys.on('down', 'downArrow', () => { this.nudgeSelected(0, 1); });
    hotkeys.on('down', 'upArrow', () => { this.nudgeSelected(0, -1); });
    hotkeys.on('down', 'leftArrow', () => { this.nudgeSelected(-1, 0); });
    hotkeys.on('down', 'rightArrow', () => { this.nudgeSelected(1, 0); });


    this.canvas.updateDimensions();

    this.canvas.refreshAll();
  }

  initState() {
    this.state = {
      selection: []
    };

  }

  setPosition(posn) {
    this.position = posn;
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

    let center = { x: this.canvas.width/2, y: this.canvas.height/2 };
    context.fillStyle = 'purple';
    context.fillRect(center.x-5, center.y-5, 10, 10);
  }

  handleMouseMove() {
    delete this.state.hovering;

    if (!this.doc) return;

    let docPosn = this.canvas.cursor.currentPosn.clone();
    if (!docPosn) return;

    docPosn.x = this.x.invert(docPosn.x);
    docPosn.y = this.y.invert(docPosn.y);

    let elems = this.doc.elements.slice(0).reverse();

    for (let element of elems) {
      if (shapes.contains(element, docPosn)) {
        this.state.hovering = element;
        break;
      }
    }
  }

  nudgeSelected(x,y) {
    for (let elem of this.state.selection) {
      elem.nudge(x,y);
    }
    this.canvas.refreshAll();
  }

  refreshObjects(layer, context) {
    let hovering = this.state.hovering;

    for (let elem of this.state.selection) {

      let bounds = elem.bounds();

      context.strokeStyle = 'blue';
      context.strokeRect(
        this.xSharp(bounds.x),
        this.ySharp(bounds.y),
        this.zScale(bounds.width),
        this.zScale(bounds.height)
      );


      let points = elem.points;
      if (points.segments) {
        for (let segment of points.segments) {
          for (let point of segment.points) {
            let x = this.xSharp(point.x);
            let y = this.ySharp(point.y);

            //context.fillStyle = 'white';
            context.strokeStyle = 'blue';
            //context.fillRect(this.x(point.x)-2, this.y(point.y)-1, 4, 4);
            context.strokeRect(x-2, y-2, 4, 4);

            context.fillText(Math.round(point.y), x-2, y-2);

            if (point.x2) {
              context.strokeRect(this.xSharp(point.x2)-2, this.ySharp(point.y2)-2, 4, 4);
            }
            if (point.x3) {
              context.strokeRect(this.xSharp(point.x3)-2, this.ySharp(point.y3)-2, 4, 4);
            }
          }
        }
      }
    }

    if (hovering) {
      let points = hovering.points;
      if (points.segments) {
        for (let segment of points.segments) {
          for (let point of segment.points) {
            let x = this.xSharp(point.x);
            let y = this.ySharp(point.y);

            //context.fillStyle = 'white';
            context.strokeStyle = 'blue';
            //context.fillRect(this.x(point.x)-2, this.y(point.y)-1, 4, 4);
            context.strokeRect(x-2, y-2, 4, 4);

            if (point.x2) {
              context.strokeRect(this.xSharp(point.x2)-2, this.ySharp(point.y2)-2, 4, 4);
            }
            if (point.x3) {
              context.strokeRect(this.xSharp(point.x3)-2, this.ySharp(point.y3)-2, 4, 4);
            }

          }
        }
      }
    }
  }


}
