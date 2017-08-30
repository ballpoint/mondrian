import MenuBody from 'ui/components/menus/MenuBody';
import MenuItem from 'ui/components/menus/MenuItem';
import HistoryFrame from 'history/Frame';
import * as actions from 'history/actions/actions';

let GeometryMenu = React.createClass({
  flip(axis) {
    this.props.editor.flipSelected(axis);
  },

  render() {
    let selectionExists = this.props.editor.hasSelection();
    let editor = this.props.editor;

    return (
      <MenuBody
        absoluteTop={this.props.absoluteTop}
        absoluteLeft={this.props.absoluteLeft}>
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
      </MenuBody>
    );
  }
});

export default GeometryMenu;
