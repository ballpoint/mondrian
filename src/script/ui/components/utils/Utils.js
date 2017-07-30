import 'utils/utils.scss';
import TransformUtil from 'ui/components/utils/Transform';
import HistoryUtil from 'ui/components/utils/History';
import BooleanUtil from 'ui/components/utils/Boolean';
import DocumentUtil from 'ui/components/utils/Document';

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

    w.push(
      <TransformUtil
        key="selection"
        editor={this.props.editor}
        selection={this.state.selection}
        selectionBounds={this.state.selectionBounds}
      />
    );

    if (this.props.editor.doc) {
      w.push(
        <DocumentUtil
          key="document"
          editor={this.props.editor} 
          selection={this.state.selection}
          selectionBounds={this.state.selectionBounds}
        />
      );
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
