export default React.createClass({
  render() {
    return (
      <div className="toolbar-group">
        {this.props.children}
      </div>
    );
  }
});
