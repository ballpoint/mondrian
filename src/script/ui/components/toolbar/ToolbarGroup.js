export default class extends React.Component {
  render() {
    return (
      <div className="toolbar-group">
        {this.props.children}
      </div>
    );
  }
}
