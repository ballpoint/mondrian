import classnames from 'classnames';
import "menus.scss";

let MenuItem = React.createClass({
  render() {
    return (
      <div
        className={classnames({
          "app-menu-item": true,
          "disabled": this.props.disabled
        })}
        onClick={this.props.action}
      >
        {this.props.label}
      </div>
    );
  }
});

export default MenuItem;

