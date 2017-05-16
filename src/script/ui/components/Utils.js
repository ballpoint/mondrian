import React from 'react';
import 'utils.scss';

let Utils = React.createClass({
  getInitialState() {
    return {
      selection: [],
    }
  },
  componentDidMount() {
    this.props.editor.on('change', () => {
      this.setState({
        selection:       this.props.editor.state.selection,
        selectionBounds: this.props.editor.state.selectionBounds
      });
    });
  },

  render() {
    return (
      <div>
        <div className="util-window">
          <div>{this.state.selection.length}</div>
          {
            this.state.selection.length > 0 ? (
            <div>{this.state.selectionBounds.x}</div>
            ) : null
          }
        </div>
        <div className="util-window">
          <div>{this.state.selection.length}</div>
          {
            this.state.selection.length > 0 ? (
            <div>{this.state.selectionBounds.x}</div>
            ) : null
          }
        </div>
      </div>
    );
  }
});

export default Utils;
