import 'util/prototypes';
import 'main.scss';
import Doc from 'io/doc';
import abq from 'abq.svg';
import sbux from 'sbux.svg';
import sbux2 from 'sbux2.svg';
import nyt from 'nyt.svg';
import bool from 'bool.svg';
import windows from 'windows.svg';
import google from 'google.svg';
import Editor from 'ui/editor';
import Utils from 'ui/components/Utils';

let doc = Doc.fromSVG(bool);

let editor = new Editor('#app-render');

ReactDOM.render(React.createElement(Utils, {
  editor
}), document.getElementById('app-windows'));

editor.load(doc);

console.log(doc);
