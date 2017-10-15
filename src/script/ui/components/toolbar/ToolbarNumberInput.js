import TextInput from 'ui/components/utils/TextInput';

export default class extends React.Component {
  render() {
    return (
      <div className="toolbar-item" title={this.props.title}>
        {this.props.label}
        <TextInput {...this.props} />
      </div>
    );
  }
}
