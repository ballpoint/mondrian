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
import points from 'points.svg';
import rects from 'rects.svg';
import text from 'text2.svg';
import handletest from 'handletest.svg';
import shoppingCart from 'shopping-cart.svg';
import nikon from 'Nikon_Logo.svg';

import Editor from 'ui/editor';
import Utils from 'ui/components/utils/Utils';
import Tools from 'ui/components/tools/Tools';
import Toolbar from 'ui/components/toolbar/Toolbar';
import Title from 'ui/components/title/Title';
import Menus from 'ui/components/menus/Menus';

import View from 'ui/components/Editor';

let root = document.querySelector('main');
let editor = new Editor();

ReactDOM.render(
  React.createElement(View, {
    doc: {
      svg: handletest,
      name: 'handletest.svg'
    }
  }),
  root
);
