import MenuBody from 'ui/components/menus/MenuBody';
import MenuItem from 'ui/components/menus/MenuItem';
import "menus.scss";

let EditMenu = React.createClass({
  render() {
    let selectionExists = this.props.editor.state.selection.length > 0;
    let editor = this.props.editor;
    let history = this.props.editor.history;
    return (
      <MenuBody absoluteTop={this.props.absoluteTop} absoluteLeft={this.props.absoluteLeft}>
        <MenuItem
          label="Undo"
          disabled={!history.canUndo()}
          action={editor.undo.bind(editor)}
          hotkey="Ctrl-Z"
        />
        <MenuItem
          label="Redo"
          disabled={!history.canRedo()}
          action={editor.redo.bind(editor)}
          hotkey="Shift-Ctrl-Z"
        />
        <MenuItem
          label="Cut"
          disabled={!selectionExists}
          action={editor.copy.bind(editor)}
          hotkey="Ctrl-X"
        />
        <MenuItem
          label="Copy"
          disabled={!selectionExists}
          action={editor.copy.bind(editor)}
          hotkey="Ctrl-C"
        />
        <MenuItem
          label="Paste"
          disabled={!selectionExists}
          action={editor.paste.bind(editor)}
          hotkey="Ctrl-V"
        />
      </MenuBody>
    );
  }
});

export default EditMenu;


