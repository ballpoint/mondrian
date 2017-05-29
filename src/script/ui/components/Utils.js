import React from 'react';
import 'utils.scss';
import TransformUtil from 'ui/components/Transform';
import LayersUtil from 'ui/components/Layers';
import HistoryUtil from 'ui/components/History';
import BooleanUtil from 'ui/components/Boolean';

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

  getWindows() {
    let w = [];

    if (this.state.selection.length > 0) {
      w.push(<TransformUtil key="transform" editor={this.props.editor} />);

      //w.push(<BooleanUtil key="boolean" editor={this.props.editor} />);
    }

    w.push(<LayersUtil key="layers" editor={this.props.editor} />);

    if (this.props.editor.history) {
      w.push(<HistoryUtil key="history" history={this.props.editor.history} />);
    }

    return w;
  },

  render() {
    return (
      <div>
        {this.getWindows()}
      </div>
    );
  }
});

export default Utils;
