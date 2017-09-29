import MenuBody from 'ui/components/menus/MenuBody';
import MenuItem from 'ui/components/menus/MenuItem';
import MenuGroup from 'ui/components/menus/MenuGroup';
import HistoryFrame from 'history/Frame';
import * as actions from 'history/actions/actions';

let GeometryMenu = React.createClass({
  flip(axis) {
    this.props.editor.flipSelected(axis);
  },

  render() {
    let selectionExists = !this.props.editor.state.selection.empty;
    let editor = this.props.editor;

    return (
      <MenuBody
        absoluteTop={this.props.absoluteTop}
        absoluteLeft={this.props.absoluteLeft}>
        <MenuGroup>
          <MenuItem
            label="Group"
            hotkey="Ctrl-G"
            disabled={!selectionExists}
            action={editor.groupSelection.bind(editor)}
          />
          <MenuItem
            label="Ungroup"
            hotkey="Shift-Ctrl-G"
            disabled={!selectionExists}
            action={editor.ungroupSelection.bind(editor)}
          />
        </MenuGroup>
        <MenuGroup>
          <MenuItem
            label="Flip horizontally"
            disabled={!selectionExists}
            action={() => {
              this.flip('x');
            }}
          />
          <MenuItem
            label="Flip vertically"
            disabled={!selectionExists}
            action={() => {
              this.flip('y');
            }}
          />
        </MenuGroup>
        <MenuGroup>
          <MenuItem
            label="Move forward"
            disabled={!selectionExists}
            action={() => {
              editor.shiftSelected(1);
            }}
            hotkey="Ctrl-Up"
          />
          <MenuItem
            label="Move backward"
            disabled={!selectionExists}
            action={() => {
              editor.shiftSelected(-1);
            }}
            hotkey="Ctrl-Down"
          />
        </MenuGroup>
      </MenuBody>
    );
  }
});

export default GeometryMenu;
