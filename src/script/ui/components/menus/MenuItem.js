import classnames from 'classnames';
import "menus.scss";

let MenuItem = React.createClass({
  render() {
    return (
      <div
        className={classnames({
          "app-menu-item": true,
          "disabled": this.props.disabled,
          [this.props.className]: true
        })}
        onClick={this.props.action}
      >
        {this.props.label || this.props.children}
      </div>
    );
  }
});

export default MenuItem;

