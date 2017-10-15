import 'title/title.scss';

class Title extends React.Component {
  state = {
    doc: null
  };

  componentDidMount() {
    this.props.editor.on('change:doc', () => {
      this.setState({
        doc: this.props.editor.doc
      });
    });
  }

  render() {
    if (!this.state.doc) return null;

    return (
      <h2>
        {this.state.doc.name}
      </h2>
    );
  }
}

export default Title;
