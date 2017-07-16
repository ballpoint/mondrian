import "menus.scss";

let MenuButton = React.createClass({
  render() {
    return (
      <div className="app-menu-button">
        {this.props.name}
      </div>
    );
  }
});

export default MenuButton;
