let TextInput = React.createClass({
  getInitialState() {
    return {
      value: this.props.value || '',
      lastCommittedValue: this.props.value || ''
    };
  },

  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.state.value && !this.state.isFocused) {
      this.setState({
        value: nextProps.value || '',
        lastCommittedValue: nextProps.value || ''
      });
    }
  },

  render() {
    let label;
    if (this.props.label) {
      label = <label htmlFor={this.props.id}>{this.props.label}</label>;
    }

    let style = {};
    if (this.props.width) {
      style.width = this.props.width;
    }

    let input = (
      <input
        type="text"
        id={this.props.id}
        value={this.state.value}
        style={style}
        onChange={e => {
          this.setState({ value: e.target.value });
        }}
        onKeyDown={e => {
          e.stopPropagation();
          if (e.which === 13) {
            e.target.blur();
          }
          this.setState({ value: e.target.value });
        }}
        onFocus={e => {
          this.setState({ isFocused: true });
        }}
        onBlur={e => {
          this.setState({ isFocused: false });
          // Enter
          if (this.props.onSubmit) {
            this.props.onSubmit(e.target.value);
          }
          this.setState({ lastCommittedValue: this.state.value });
        }}
        onClick={e => {
          e.target.select();
        }}
      />
    );

    return (
      <span className="text-input">
        {label}
        {input}
      </span>
    );
  }
});

export default TextInput;
