import { PIXEL_RATIO } from 'lib/math';

let CurrentColors = React.createClass({
  render() {
    let { fill, stroke } = this.props.editor.state.colors;
    let strokeWidth = Math.min(
      6,
      this.props.editor.state.stroke.width * PIXEL_RATIO
    );

    return (
      <div id="current-colors">
        <div
          className="color-indicator"
          id="color-fill"
          style={{
            outline: stroke
              ? `${strokeWidth}px solid ${stroke.toHexString()}`
              : '',
            background: fill.toString()
          }}
        />
        <div
          className="color-indicator"
          id="color-stroke"
          style={{
            background: stroke.toHexString()
          }}
        />
      </div>
    );
  }
});

export default CurrentColors;
