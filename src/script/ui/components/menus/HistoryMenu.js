import MenuBody from 'ui/components/menus/MenuBody';
import MenuItem from 'ui/components/menus/MenuItem';
import 'menus.scss';

let HistoryMenu = React.createClass({
  render() {
    return (
      <MenuBody
        absoluteTop={this.props.absoluteTop}
        absoluteLeft={this.props.absoluteLeft}
      >
        <MenuItem
          label="Undo"
          disabled={false}
          action={this.props.editor.undo.bind(this.props.editor)}
        />
        <MenuItem
          label="Redo"
          disabled={false}
          action={this.props.editor.redo.bind(this.props.editor)}
        />
      </MenuBody>
    );
  }
});

export default HistoryMenu;
