import 'util/prototypes';
import 'main.scss';
import Doc from 'io/doc';

// Test files
import abq from 'abq.svg';
import cmg from 'cmg.svg';
import sbux from 'sbux.svg';
import sbux2 from 'sbux2.svg';
import nyt from 'nyt.svg';
import xn from 'xn.svg';
import google from 'google.svg';
import pioneer from 'Pioneer_plaque.svg';
import bool from 'booltest/overlapcircle.svg';
import tesla from 'Tesla_Motors.svg';
import rects from 'rects.svg';
import shoppingCart from 'shopping-cart.svg';
import nikon from 'Nikon_Logo.svg';

import Editor from 'ui/editor';
import Utils from 'ui/components/utils/Utils';
import Tools from 'ui/components/tools/Tools';
import Toolbar from 'ui/components/toolbar/Toolbar';
import Title from 'ui/components/title/Title';
import Menus from 'ui/components/menus/Menus';

let root = document.getElementById('app-render');
let editor = new Editor(root);

ReactDOM.render(
  React.createElement(Utils, { editor }),
  document.getElementById('app-windows')
);

ReactDOM.render(
  React.createElement(Menus, { editor }),
  document.getElementById('app-menus')
);

ReactDOM.render(
  React.createElement(Tools, { editor }),
  document.getElementById('app-tools')
);

ReactDOM.render(
  React.createElement(Title, { editor }),
  document.getElementById('app-title')
);

ReactDOM.render(
  React.createElement(Toolbar, { editor }),
  document.getElementById('app-toolbar')
);

let doc = Doc.fromSVG(rects, 'rects.svg');
editor.load(doc);
