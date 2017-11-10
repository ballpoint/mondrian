import TextInput from 'ui/components/utils/TextInput';
import 'title/title.scss';

class Title extends React.Component {
  render() {
    if (!this.props.value) return null;

    return (
      <h2>
        <TextInput value={this.props.value} onSubmit={this.props.rename} />
      </h2>
    );
  }
}

export default Title;
