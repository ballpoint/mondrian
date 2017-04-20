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

    this.canvas.refresh();
  }

  initCanvas() {
    this.canvas = new Canvas(this.root);

    this.canvas.createLayer('drawing', (l, c) => {
      this.refreshDrawing(l, c);
    });

    this.canvas.updateDimensions();

    this.canvas.refresh();
  }

  initState() {
    this.position;
  }

  refreshDrawing(layer, context) {
    if (this.doc) {
      for (let elem of this.doc.elements) {
        elem.drawToCanvas(context);
      }
    }
  }
}
