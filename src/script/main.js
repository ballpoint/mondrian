import 'util/prototypes';
import 'main.scss';
import Doc from 'io/doc';
import abq from 'abq.svg';
import sbux from 'sbux.svg';
import cmg from 'cmg.svg';
import google from 'google.svg';
import Editor from 'ui/editor';
import Utils from 'ui/components/Utils';

let doc = Doc.fromSVG(google);

let editor = new Editor('#app-render');

ReactDOM.render(React.createElement(Utils, {
  editor
}), document.getElementById('app-windows'));

editor.load(doc);

console.log(doc);
