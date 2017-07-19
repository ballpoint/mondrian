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
import circles1 from 'booltest/circles1.svg';
import circles2 from 'booltest/circles2.svg';
import hazmat from 'booltest/hazmat.svg';
import oog from 'booltest/oog.svg';

const testFiles = {
  rect1,
  crosshatch,
  circles1,
  circles2,
  hazmat,
  oog,
}

let main = document.querySelector('main');

let i = 0;
let filter;
if (location.hash) {
  filter = parseInt(location.hash.replace('#',''), 10);
}

function appendDoc(section, doc, label) {
  let w = doc.width;
  let h = doc.height;
  let container = document.createElement('div');
  container.className = 'doc'
  container.style.width = w+'px';
  container.style.height = h+'px';

  let labelElem = document.createElement('a');
  labelElem.innerHTML = label;
  labelElem.href = '#'+i
  labelElem.target = 'solo';

  section.appendChild(container);
  let cnv = new Canvas(container);
  cnv.setDimensions(w, h);

  let proj = new Projection(
    scaleLinear().domain([0, w]).range([0, w]),
    scaleLinear().domain([0, h]).range([0, h]),
    1
  );

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
  if (filter === undefined || i === filter) {
    appendDoc(section, doc, key);
  }
  i++;

  // Draw united
  if (filter === undefined || i === filter) {
    let united = boolDoc(doc, 'unite');
    appendDoc(section, united.doc, 'unite: ' + united.time.toFixed(2) + 'ms');
  }
  i++;

  // Draw united
  if (filter === undefined || i === filter) {
    let subtracted = boolDoc(doc, 'subtract');
    appendDoc(section, subtracted.doc, 'subtract: ' + subtracted.time.toFixed(2) + 'ms');
  }
  i++;

  // Draw intersected
  if (filter === undefined || i === filter) {
    let intersected = boolDoc(doc, 'intersect');
    appendDoc(section, intersected.doc, 'subtract: ' + intersected.time.toFixed(2) + 'ms');
  }
  i++;
}
