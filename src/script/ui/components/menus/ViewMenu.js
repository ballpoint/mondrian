import MenuBody from 'ui/components/menus/MenuBody';
import MenuItem from 'ui/components/menus/MenuItem';
import "menus.scss";

let ViewMenu = React.createClass({
  render() {
    return (
      <MenuBody absoluteTop={this.props.absoluteTop} absoluteLeft={this.props.absoluteLeft}>
        <MenuItem label="Zoom in" />
        <MenuItem label="Zoom out" />
      </MenuBody>
    );
  }
});

export default ViewMenu;


