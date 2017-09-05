import TextInput from 'ui/components/utils/TextInput';

export default React.createClass({
  render() {
    return (
      <div className="toolbar-item" title={this.props.title}>
        {this.props.label}
        <TextInput {...this.props} />
      </div>
    );
  }
});
