
class Util extends React.Component {
  render() {
    return (
      <div
        className={classnames({
          'util-window': true,
          'util-window--grow': this.props.grow === true
        })}
        id={'util-' + this.props.id}>
        <div className="util-header">{this.props.title}</div>

        <div className="util-body">{this.props.children}</div>
      </div>
    );
  }
}

export default Util;
