import { scaleLinear } from 'd3-scale';
import Canvas from 'ui/canvas';

export default class Editor {
  constructor(rootSelector) {

    let root = document.querySelector(rootSelector);
    if (root) {
      this.root = root;

      this.initCanvas();

      this.initState();

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
    this.canvas.createLayer('drawing', (l, c) => {
      this.refreshDrawing(l, c);
    });

    this.canvas.cursor.on('mousemove', (e, posn) => {
      console.log(posn);
    });

    this.canvas.updateDimensions();

    this.canvas.refreshAll();
  }

  initState() {
    this.position;
  }

  setPosition(posn) {
    this.position = posn;
    console.log(posn);

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
    let zoomLevel = 0.6;
    if (this.doc) {

      let offsetLeft = (this.canvas.width - (this.doc.width*zoomLevel)) / 2;
      offsetLeft += ((this.doc.width/2)-this.position.x)*zoomLevel;
      let offsetTop  = (this.canvas.height - (this.doc.height*zoomLevel)) / 2;
      offsetTop += ((this.doc.height/2)-this.position.y)*zoomLevel;

      console.log(offsetLeft, offsetTop);

      this.x = scaleLinear()
        .domain([0, this.doc.width])
        .range([offsetLeft, offsetLeft + (this.doc.width*zoomLevel)]);

      this.y = scaleLinear()
        .domain([0, this.doc.height])
        .range([offsetTop, offsetTop + (this.doc.height*zoomLevel)]);
    }

    context.fillStyle = 'lightgrey';
    context.fillRect(0, 0, layer.width, layer.height);

    if (this.doc) {
      context.fillStyle = 'white';
      context.strokeStyle = 'black';
      context.fillRect(this.x(0), this.y(0), this.doc.width*zoomLevel, this.doc.height*zoomLevel);
      context.strokeRect(this.x(0), this.y(0), this.doc.width*zoomLevel, this.doc.height*zoomLevel);
    }

    let center = { x: this.canvas.width/2, y: this.canvas.height/2 };
    context.fillStyle = 'purple';
    context.fillRect(center.x-5, center.y-5, 10, 10);
  }
}
