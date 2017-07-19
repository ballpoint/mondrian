import 'util/prototypes';
import 'test/testbool.scss';
import Doc from 'io/doc';
import { scaleLinear } from 'd3-scale';
import Projection from 'ui/projection';
import Layer from 'io/layer';
import Canvas from 'ui/canvas';
import bool from 'lib/bool';

import rect1 from 'booltest/rect1.svg';

const testFiles = {
  'rect1': rect1,
}

let main = document.querySelector('main');

function drawToCanvas(section, doc) {
  let w = doc.width;
  let h = doc.height;
  let container = document.createElement('div');
  container.className = 'doc'
  container.style.width = w+'px';
  container.style.height = h+'px';

  section.appendChild(container);
  let cnv = new Canvas(container);
  cnv.setDimensions(w, h);

  let proj = new Projection(
    scaleLinear().domain([0, w]).range([0, w]),
    scaleLinear().domain([0, h]).range([0, h]),
    1
  );

  cnv.createLayer('main', (layer, context) => {
    doc.drawToCanvas(layer, context, proj);
  });


  cnv.refreshAll();

  return container;
}

function boolDoc(doc, op) {
  let children = doc.elements
  let layer = new Layer({
    id: 'main',
    children: [bool[op](children)]
  });

  return new Doc({
    layers: [layer],
    width: doc.width,
    height: doc.height,
  });
}

for (let key in testFiles) {
  let file = testFiles[key];
  let doc = Doc.fromSVG(file);  

  let section = document.createElement('section');
  main.appendChild(section);

  // Draw original
  drawToCanvas(section, doc);

  // Draw united
  let united = boolDoc(doc, 'unite');
  drawToCanvas(section, united);

  // Draw united
  let subtracted = boolDoc(doc, 'subtract');
  drawToCanvas(section, subtracted);

  // Draw intersected
  let intersected = boolDoc(doc, 'intersect');
  drawToCanvas(section, intersected);
}
