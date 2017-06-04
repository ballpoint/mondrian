import React from 'react';

let TransformUtil = React.createClass({
  label() {
    let sel = this.props.editor.state.selection
    if (sel.length === 1) {
      return sel[0].constructor.name +' '+sel[0]._i
    } else {
      return sel.length + ' items'
    }
  },

  render() {
    return (
      <div className="util-window">
        <div>
          {this.label()}
        </div>
        <div>
          x = {this.props.editor.state.selectionBounds.x}
        </div>
        <div>
          y = {this.props.editor.state.selectionBounds.y}
        </div>
        <div>
          w = {this.props.editor.state.selectionBounds.width}
        </div>
        <div>
          h = {this.props.editor.state.selectionBounds.height}
        </div>
      </div>
    );
  }
});

export default TransformUtil;
