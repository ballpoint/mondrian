import MenuBody from 'ui/components/menus/MenuBody';
import MenuItem from 'ui/components/menus/MenuItem';

let GeometryMenu = React.createClass({
  render() {
    return (
      <MenuBody
        absoluteTop={this.props.absoluteTop}
        absoluteLeft={this.props.absoluteLeft}>
        <MenuItem label="Group" hotkey="Ctrl-G" />
        <MenuItem label="Ungroup" hotkey="Shift-Ctrl-G" />
      </MenuBody>
    );
  }
});

export default GeometryMenu;
