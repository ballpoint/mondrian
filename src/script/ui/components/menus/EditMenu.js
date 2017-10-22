import MenuBody from 'ui/components/menus/MenuBody';
import MenuItem from 'ui/components/menus/MenuItem';
import MenuGroup from 'ui/components/menus/MenuGroup';
import 'menus/menus.scss';

class EditMenu extends React.Component {
  render() {
    let selectionExists = this.props.editor.doc.state.selection.length > 0;
    let editor = this.props.editor;
    let history = this.props.editor.doc.history;
    return (
      <MenuBody
        absoluteTop={this.props.absoluteTop}
        absoluteLeft={this.props.absoluteLeft}>
        <MenuGroup>
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
        </MenuGroup>
        <MenuGroup>
          <MenuItem
            label="Cut"
            disabled={!selectionExists}
            action={editor.cut.bind(editor)}
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
            disabled={!editor.state.clipboard}
            action={editor.paste.bind(editor)}
            hotkey="Ctrl-V"
          />
        </MenuGroup>
      </MenuBody>
    );
  }
}

export default EditMenu;
