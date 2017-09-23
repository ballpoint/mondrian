import bool from 'lib/bool';
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

let Toolbar = React.createClass({
  getInitialState() {
    return {
      selection: null
    };
  },

  componentDidMount() {
    this.props.editor.on('change:selection', () => {
      this.setState({
        selection: this.props.editor.state.selection,
        selectionType: this.props.editor.state.selectionType
      });
    });
  },

  renderHistoryGroup() {
    return (
      <ToolbarGroup>
        <ToolbarButton
          onClick={this.props.editor.undo.bind(this.props.editor)}
          title="Undo">
          {renderIcon('undo')}
        </ToolbarButton>
        <ToolbarButton
          onClick={this.props.editor.redo.bind(this.props.editor)}
          title="Redo">
          {renderIcon('redo')}
        </ToolbarButton>
      </ToolbarGroup>
    );
  },

  renderBooleanGroup() {
    let editor = this.props.editor;

    let boolOp = function(op) {
      return function() {
        let result = bool[op](this.state.selection.slice(0));

        let index = editor.selectedIndexes()[0];

        let frame = new HistoryFrame(
          [
            new actions.DeleteAction({
              items: editor.state.selection.slice(0).map(item => {
                return { item, index: item.index };
              })
            }),
            new actions.InsertAction({
              items: [{ item: result, index }]
            })
          ],
          'Boolean ' + op
        );

        editor.stageFrame(frame);
        editor.commitFrame();
      }.bind(this);
    }.bind(this);

    if (this.state.selection && this.state.selection.length > 1) {
      return (
        <ToolbarGroup>
          <ToolbarButton onClick={boolOp('unite')} title="Unite">
            U
          </ToolbarButton>
          <ToolbarButton onClick={boolOp('subtract')} title="Subtract">
            S
          </ToolbarButton>
          <ToolbarButton onClick={boolOp('intersect')} title="Intersect">
            X
          </ToolbarButton>
        </ToolbarGroup>
      );
    }
  },

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
});

export default Toolbar;
