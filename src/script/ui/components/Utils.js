import React from 'react';

let Utils = React.createClass({
  getInitialState() {
    return {
      selection: []
    }
  },
  componentDidMount() {
    this.props.editor.on('selection:change', () => {
      this.setState({ selection: this.props.editor.state.selection });
    });
  },

  render() {
    return (
      <div>
        {this.state.selection.length}
      </div>
    );
  }
});

export default Utils;
