let Util = React.createClass({
  render() {
    return (
      <div className="util-window">
        <div className="util-header">
          {this.props.title}
        </div>

        <div className="util-body">
          {this.props.children}
        </div>
      </div>
    );
  }
});

export default Util;
