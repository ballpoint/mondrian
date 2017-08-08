
let CurrentColors = React.createClass({

  render() {
    let { fill, stroke } = this.props.editor.state.colors;
    let strokeWidth = Math.min(2, Math.max(6, this.props.editor.state.stroke.width));

    return (
      <div id="current-colors">
        <div className="color-indicator" id="color-fill" style={{
          outline: (stroke ? `${strokeWidth}px solid ${stroke.toHexString()}` : ''),
          background: fill.toString()
        }}></div>
        <div className="color-indicator" id="color-stroke" style={{
          background: stroke.toHexString()
        }}></div>
      </div>
    );
  }
});

export default CurrentColors;
