import 'util/prototypes';
import 'main.scss';
import SVG from 'io/svg';
import abq from 'abq.svg';
import sbux from 'sbux.svg';
import airplane from 'airplane.svg';
import google from 'google.svg';
import Editor from 'ui/editor';
import React from 'react';
import ReactDOM from 'react-dom';
import Utils from 'ui/components/Utils';

let doc = new SVG(airplane);

let editor = new Editor('#app-render');

ReactDOM.render(React.createElement(Utils, {
  editor
}), document.getElementById('app-windows'));

editor.load(doc);

console.log(doc);
