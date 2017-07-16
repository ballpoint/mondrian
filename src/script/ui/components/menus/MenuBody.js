import "menus.scss";

let MenuBody = React.createClass({
  render() {
    return (
      <div className="app-menu-button">
        {this.props.name}
      </div>
    );
  }
});

export default MenuBody;
