import 'util/prototypes';
import 'main.scss';
import Doc from 'io/doc';
import abq from 'abq.svg';
import sbux from 'sbux.svg';
import sbux2 from 'sbux2.svg';
import nyt from 'nyt.svg';
import bool from 'bool4.svg';
import xn from 'xn.svg';
import google from 'google.svg';
import pioneer from 'Pioneer_plaque.svg';
import Editor from 'ui/editor';
import Utils from 'ui/components/utils/Utils';
import Menus from 'ui/components/menus/Menus';

let doc = Doc.fromSVG(google);

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

editor.load(doc);

console.log(doc);
