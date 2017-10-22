import MenuBody from 'ui/components/menus/MenuBody';
import MenuItem from 'ui/components/menus/MenuItem';
import MenuGroup from 'ui/components/menus/MenuGroup';
import HistoryFrame from 'history/Frame';
import * as actions from 'history/actions/actions';

class GeometryMenu extends React.Component {
  flip = axis => {
    this.props.editor.flipSelected(axis);
  };

  render() {
    let selectionExists = !this.props.editor.doc.state.selection.empty;
    let selectionMultiple = this.props.editor.doc.state.selection.length > 1;
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
        <MenuGroup>
          <MenuItem
            label="Unite"
            disabled={!selectionMultiple}
            action={() => {
              editor.booleanSelected('unite');
            }}
          />
          <MenuItem
            label="Subtract"
            disabled={!selectionMultiple}
            action={() => {
              editor.booleanSelected('subtract');
            }}
          />
          <MenuItem
            label="Intersect"
            disabled={!selectionMultiple}
            action={() => {
              editor.booleanSelected('intersect');
            }}
          />
        </MenuGroup>
      </MenuBody>
    );
  }
}

export default GeometryMenu;
