import classnames from 'classnames';
import 'menus/menus.scss';

let MenuItem = React.createClass({
  render() {
    return (
      <div
        className={classnames({
          'app-menu-item': true,
          disabled: this.props.disabled,
          [this.props.className]: true
        })}
        onClick={this.props.action}
        href={this.props.href}>
        <div className="app-menu-item__label">
          {this.props.label || this.props.children}
        </div>

        {this.props.hotkey
          ? <div className="app-menu-item__hotkey">
              {this.props.hotkey}
            </div>
          : null}
      </div>
    );
  }
});

export default MenuItem;
