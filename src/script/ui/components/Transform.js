import React from 'react';

let TransformUtil = React.createClass({
  render() {
    return (
      <div className="util-window">
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
