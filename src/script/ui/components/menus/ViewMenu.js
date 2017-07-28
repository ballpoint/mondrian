import MenuBody from 'ui/components/menus/MenuBody';
import MenuItem from 'ui/components/menus/MenuItem';
import "menus.scss";

let ViewMenu = React.createClass({
  render() {
    let editor = this.props.editor;
    return (
      <MenuBody absoluteTop={this.props.absoluteTop} absoluteLeft={this.props.absoluteLeft}>
        <MenuItem label="Zoom in" action={editor.zoomIn.bind(editor)} hotkey="+" />
        <MenuItem label="Zoom out" action={editor.zoomOut.bind(editor)} hotkey="-" />
        <MenuItem label="Fit to screen" action={editor.fitToScreen.bind(editor)} hotkey="0" />
      </MenuBody>
    );
  }
});

export default ViewMenu;


