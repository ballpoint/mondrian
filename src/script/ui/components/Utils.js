import 'utils/utils.scss';
import SelectionUtil from 'ui/components/Selection';
import HistoryUtil from 'ui/components/History';
import BooleanUtil from 'ui/components/Boolean';
import DocumentUtil from 'ui/components/Document';

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

    if (this.props.editor.state.selection.length > 0) {
      w.push(<SelectionUtil key="selection" editor={this.props.editor} />);
    }

    if (this.props.editor.doc) {
      w.push(<DocumentUtil key="document" editor={this.props.editor} />);
    }

    //w.push(<BooleanUtil key="boolean" editor={this.props.editor} />);

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
