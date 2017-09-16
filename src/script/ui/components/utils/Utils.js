import 'utils/utils.scss';
import TransformUtil from 'ui/components/utils/Transform';
import DocumentUtil from 'ui/components/utils/Document';
import HistoryUtil from 'ui/components/utils/History';
import ColorUtil from 'ui/components/utils/Color';
import StrokeUtil from 'ui/components/utils/Stroke';
import AlignUtil from 'ui/components/utils/Align';

let Utils = React.createClass({
  getInitialState() {
    return {
      selection: []
    };
  },
  componentDidMount() {
    let nextFrame = null;

    window.utilCounter = { cancel: 0, ok: 0 };

    this.props.editor.on('change', () => {
      if (nextFrame !== null) {
        return;
      }

      nextFrame = window.requestAnimationFrame(() => {
        nextFrame = null;

        let editor = this.props.editor;
        window.utilCounter.ok++;

        this.setState({
          selection: editor.state.selection,
          selectionBounds: editor.state.selectionBounds,
          hasSelectedElements:
            editor.state.selection.length > 0 &&
            editor.state.selectionType === 'ELEMENTS',
          hasSelectedPoints:
            editor.state.selection.length > 0 &&
            editor.state.selectionType === 'POINTS'
        });
      });
    });
  },

  getUtilsLeft() {
    let w = [];

    if (!this.props.editor.doc) return w;

    w.push(
      <ColorUtil
        key="color"
        editor={this.props.editor}
        selection={this.state.selection}
        selectionBounds={this.state.selectionBounds}
      />
    );

    w.push(
      <StrokeUtil
        key="stroke"
        editor={this.props.editor}
        selection={this.state.selection}
        selectionBounds={this.state.selectionBounds}
      />
    );

    w.push(
      <AlignUtil
        key="align"
        editor={this.props.editor}
        selection={this.state.selection}
        selectionBounds={this.state.selectionBounds}
      />
    );

    return w;
  },

  getUtilsRight() {
    let w = [];

    if (!this.props.editor.doc) return w;

    w.push(
      <TransformUtil
        key="selection"
        editor={this.props.editor}
        selection={this.state.selection}
        selectionBounds={this.state.selectionBounds}
      />
    );

    w.push(
      <DocumentUtil
        key="document"
        editor={this.props.editor}
        selection={this.state.selection}
        selectionBounds={this.state.selectionBounds}
      />
    );

    w.push(
      <HistoryUtil
        key="history"
        editor={this.props.editor}
        doc={this.props.editor.doc}
        selection={this.state.selection}
        selectionBounds={this.state.selectionBounds}
      />
    );

    return w;
  },

  render() {
    return (
      <div id="app-utils">
        <div id="app-utils-left">{this.getUtilsLeft()}</div>
        <div id="app-utils-right">{this.getUtilsRight()}</div>
      </div>
    );
  }
});

export default Utils;
