import 'menus/menus.scss';

class MenuItem extends React.Component {
  onClick(e) {
    if (this.props.action) {
      this.props.action();
    }
  }

  render() {
    return (
      <a
        className={classnames({
          'app-menu-item': true,
          disabled: this.props.disabled,
          [this.props.className || '']: true
        })}
        onClick={this.onClick.bind(this)}
        href={this.props.href}
        target={this.props.target}>
        <div className="app-menu-item__label">
          {this.props.label || this.props.children}
        </div>
        {this.props.hotkey ? (
          <div className="app-menu-item__hotkey">{this.props.hotkey}</div>
        ) : null}
      </a>
    );
  }
}

export default MenuItem;
