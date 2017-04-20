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
  }

  initCanvas() {
    this.canvas = new Canvas(this.root);

    this.canvas.createLayer('drawing');

    this.canvas.setDimensions(600, 600);
  }

  initState() {
    this.position;
  }
}
