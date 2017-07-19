import MenuBody from 'ui/components/menus/MenuBody';
import MenuItem from 'ui/components/menus/MenuItem';
import "menus.scss";

let FileMenu = React.createClass({
  render() {
    return (
      <MenuBody absoluteTop={this.props.absoluteTop} absoluteLeft={this.props.absoluteLeft}>
        <MenuItem label="New" />
        <MenuItem label="Save" />
      </MenuBody>
    );
  }
});

export default FileMenu;

