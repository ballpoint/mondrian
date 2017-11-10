import 'utils/utils.scss';
import TransformUtil from 'ui/components/utils/Transform';
import DocumentUtil from 'ui/components/utils/Document';
import HistoryUtil from 'ui/components/utils/History';
import ColorUtil from 'ui/components/utils/Color';
import StrokeUtil from 'ui/components/utils/Stroke';
import AlignUtil from 'ui/components/utils/Align';
import { ELEMENTS, POINTS, PHANDLE, SHANDLE } from 'ui/selection';

class Utils extends React.Component {
  constructor() {
    super();

    this.state = {
      selection: [],
      frameId: 1
    };
  }

  componentDidMount() {
    let editor = this.props.editor;

    let nextFrame = null;

    editor.on('change', () => {
      if (nextFrame !== null) {
        return;
      }

      if (editor.doc.history.head.id !== undefined) {
        nextFrame = window.requestAnimationFrame(() => {
          this.setState({
            frameId: editor.doc.history.head.id,

            selection: editor.doc.state.selection,
            hasSelectedElements:
              editor.doc.state.selection.length > 0 &&
              editor.doc.state.selection.type === ELEMENTS,
            hasSelectedPoints:
              editor.doc.state.selection.length > 0 &&
              editor.doc.state.selection.type === POINTS
          });
          nextFrame = null;
        });
      }
    });
  }

  getUtilsLeft = () => {
    let w = [];

    if (!this.props.editor.doc) return w;

    w.push(
      <ColorUtil
        key="color"
        editor={this.props.editor}
        selection={this.state.selection}
      />
    );

    w.push(
      <StrokeUtil
        key="stroke"
        editor={this.props.editor}
        selection={this.state.selection}
      />
    );

    w.push(
      <AlignUtil
        key="align"
        editor={this.props.editor}
        selection={this.state.selection}
      />
    );

    return w;
  };

  getUtilsRight = () => {
    let w = [];

    if (!this.props.editor.doc) return w;

    let props = {
      editor: this.props.editor,
      doc: this.props.editor.doc,
      selection: this.state.selection,
      frameId: this.props.editor.doc.history.head.id
    };

    w.push(<TransformUtil key="selection" {...props} />);

    w.push(<DocumentUtil key="document" {...props} />);

    w.push(<HistoryUtil key="history" {...props} />);

    return w;
  };

  render() {
    return (
      <div id="app-utils">
        <div id="app-utils-left">
          {this.getUtilsLeft()}
        </div>
        <div id="app-utils-right">
          {this.getUtilsRight()}
        </div>
      </div>
    );
  }
}

export default Utils;
