import 'menus/menus.scss';

class MenuButton extends React.Component {
  render() {
    return (
      <div
        className={classnames({
          'app-menu-button': true,
          active: this.props.active
        })}
        onClick={this.props.onClick}
        onMouseEnter={this.props.onMouseEnter}>
        {this.props.name}
      </div>
    );
  }
}

export default MenuButton;
