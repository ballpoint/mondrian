import MenuBody from 'ui/components/menus/MenuBody';
import MenuItem from 'ui/components/menus/MenuItem';

let GeometryMenu = React.createClass({
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
      </MenuBody>
    );
  }
});

export default GeometryMenu;
