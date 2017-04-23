import 'util/prototypes';
import SVG from 'io/svg';
import abq from 'abq.svg';
import sbux from 'sbux.svg';
import Editor from 'ui/editor';

let doc = new SVG(abq);

let editor = new Editor('#main');

editor.load(doc);

console.log(doc);
