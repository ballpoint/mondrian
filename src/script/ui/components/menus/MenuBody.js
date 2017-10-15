import 'menus/menus.scss';

class MenuBody extends React.Component {
  render() {
    return (
      <div
        className="app-menu-body"
        style={{ top: this.props.absoluteTop, left: this.props.absoluteLeft }}>
        {this.props.children}
      </div>
    );
  }
}

export default MenuBody;
