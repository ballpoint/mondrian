import 'main.scss';

import views from 'views';

let root = document.querySelector('[data-react-view]');

let view = root.getAttribute('data-react-view');
let props = JSON.parse(root.getAttribute('data-react-props'));

ReactDOM.hydrate(React.createElement(views[view], props), root);
