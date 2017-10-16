import 'title/title.scss';

class Title extends React.Component {
  render() {
    if (!this.props.value) return null;

    return <h2>{this.props.value}</h2>;
  }
}

export default Title;
