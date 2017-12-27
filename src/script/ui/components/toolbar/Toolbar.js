import Text from 'geometry/text';
import 'toolbar/toolbar.scss';
import icons from 'ui/components/icons';
import { renderIcon } from 'ui/components/icons';

import HistoryFrame from 'history/Frame';
import * as actions from 'history/actions/actions';

import ToolbarGroup from 'ui/components/toolbar/ToolbarGroup';
import ToolbarButton from 'ui/components/toolbar/ToolbarButton';
import ToolbarDropdown from 'ui/components/toolbar/ToolbarDropdown';
import ToolbarNumberInput from 'ui/components/toolbar/ToolbarNumberInput';
import TypeToolbarGroup from 'ui/components/toolbar/TypeToolbarGroup';

class Toolbar extends React.Component {
  state = {
    selection: null
  };

  componentDidMount() {
    this.props.editor.on(
      ['change:selection', 'change:tool', 'change:doc'],
      () => {
        this.setState({
          selection: this.props.editor.state.selection,
          tool: this.props.editor.state.tool
        });
      }
    );
  }

  renderHistoryGroup = () => {
    let editor = this.props.editor;

    if (!editor.doc) return null;

    return (
      <ToolbarGroup>
        <ToolbarButton onClick={editor.undo.bind(editor)} title="Undo">
          {renderIcon('undo')}
        </ToolbarButton>
        <ToolbarButton onClick={editor.redo.bind(editor)} title="Redo">
          {renderIcon('redo')}
        </ToolbarButton>
      </ToolbarGroup>
    );
  };

  renderBooleanGroup = () => {
    let editor = this.props.editor;

    if (!editor.doc) return null;

    if (this.state.selection && this.state.selection.length > 1) {
      return (
        <ToolbarGroup>
          <ToolbarButton
            onClick={() => {
              editor.booleanSelected('unite');
            }}
            title="Unite">
            {renderIcon('booleanUnite')}
          </ToolbarButton>
          <ToolbarButton
            onClick={() => {
              editor.booleanSelected('subtract');
            }}
            title="Subtract">
            {renderIcon('booleanSubtract')}
          </ToolbarButton>
          <ToolbarButton
            onClick={() => {
              editor.booleanSelected('intersect');
            }}
            title="Intersect">
            {renderIcon('booleanIntersect')}
          </ToolbarButton>
        </ToolbarGroup>
      );
    }
  };

  render() {
    return (
      <div>
        <div className="toolbar-group">
          {this.renderHistoryGroup()}
          {this.renderBooleanGroup()}
          <TypeToolbarGroup {...this.props} />
        </div>
      </div>
    );
  }
}

export default Toolbar;
