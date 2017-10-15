export default class extends React.Component {
  render() {
    return (
      <div className="toolbar-item" title={this.props.title}>
        {this.props.label}
        <select
          defaultValue={this.props.selected}
          onChange={e => {
            if (this.props.onChange) this.props.onChange(e.target.value);
          }}>
          {this.props.options.map(opt => {
            return (
              <option style={opt.style} value={opt.value}>
                {opt.label}
              </option>
            );
          })}
        </select>
      </div>
    );
  }
}
