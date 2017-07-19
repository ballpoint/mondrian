import 'util/prototypes';
import 'test/testbool.scss';
import Doc from 'io/doc';
import { scaleLinear } from 'd3-scale';
import Projection from 'ui/projection';
import Layer from 'io/layer';
import Canvas from 'ui/canvas';
import bool from 'lib/bool';

import rect1 from 'booltest/rect1.svg';
import crosshatch from 'booltest/crosshatch.svg';

const testFiles = {
  'rect1': rect1,
  'crosshatch': crosshatch,
}

let main = document.querySelector('main');

function drawToCanvas(section, doc, label) {
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

  let labelElem = document.createElement('label');
  labelElem.innerHTML = label;
  container.appendChild(labelElem);

  cnv.createLayer('main', (layer, context) => {
    doc.drawToCanvas(layer, context, proj);
  });


  cnv.refreshAll();

  return container;
}

function boolDoc(doc, op) {
  let children = doc.elements

  let t1 = window.performance.now();
  children = [bool[op](children)]
  let t2 = window.performance.now();

  let layer = new Layer({
    id: 'main',
    children
  });

  return {
    doc: new Doc({
      layers: [layer],
      width: doc.width,
      height: doc.height,
    }),
    time: t2-t1
  }
}

for (let key in testFiles) {
  let file = testFiles[key];
  let doc = Doc.fromSVG(file);  

  let section = document.createElement('section');
  main.appendChild(section);

  // Draw original
  drawToCanvas(section, doc, key);

  // Draw united
  let united = boolDoc(doc, 'unite');
  drawToCanvas(section, united.doc, 'unite: ' + united.time.toFixed(2) + 'ms');

  // Draw united
  let subtracted = boolDoc(doc, 'subtract');
  drawToCanvas(section, subtracted.doc, 'unite: ' + subtracted.time.toFixed(2) + 'ms');

  // Draw intersected
  let intersected = boolDoc(doc, 'intersect');
  drawToCanvas(section, intersected.doc, 'unite: ' + intersected.time.toFixed(2) + 'ms');
}
