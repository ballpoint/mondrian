import React from 'react';
import bool from 'lib/bool';
import Color from 'ui/color';

let BooleanUtil = React.createClass({
  do(op) {
    let queue = this.props.editor.state.selection.slice(0);
    while (queue.length > 1) {
      let result = bool(queue[0], queue[1], op);
      queue = [result].concat(queue.slice(2));
    }

    let result = queue[0];
    result.data.fill = new Color('000000');

    this.props.editor.deleteSelection();
    this.props.editor.doc.insertElement(result);
  },
  render() {
    return (
      <div className="util-window">
        <div>
          <div><a href="#" onClick={() => {this.do('unite')}}>Unite</a></div>
          <div><a href="#" onClick={() => {this.do('subtract')}}>Subtract</a></div>
          <div><a href="#" onClick={() => {this.do('intersect')}}>Intersect</a></div>
        </div>
      </div>
    );
  }
});

export default BooleanUtil;



