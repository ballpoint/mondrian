export default React.createClass({
  render() {
    return (
      <a
        className="toolbar-button"
        onClick={this.props.onClick}
        title={this.props.title}>
        {this.props.children}
      </a>
    );
  }
});
