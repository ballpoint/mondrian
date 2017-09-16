import { PIXEL_RATIO } from 'lib/math';
import Util from 'ui/components/utils/Util';
import CursorTracking from 'ui/cursor-tracking';
import Color from 'ui/color';
import 'utils/color.scss';

const PICKER_WIDTH = 256;
const PICKER_HEIGHT = PICKER_WIDTH * 6;

let ColorUtil = React.createClass({
  getInitialState() {
    return {
      expanded: false,
      pickerOffset: 0,
      saturation: 0.5
    };
  },

  renderPicker(which, color) {
    if (!this.state.expanded) return null;

    if (this.state.modifying !== which) return null;

    return (
      <div className="color-util__modify">
        <div className="color-util__picker">
          <canvas width={PICKER_WIDTH} height={PICKER_WIDTH} ref="canvas" />

          <div className="color-util__picker__slider">
            <label htmlFor="saturation-slider">Sat</label>

            <input
              id="saturation-slider"
              type="range"
              min={0}
              max={1000}
              value={this.state.saturation * 1000}
              onChange={this.onSliderChange}
            />

            <input
              type="text"
              value={(this.state.saturation * 100).toFixed(1)}
            />
          </div>
          <div className="color-util__picker__rgb">
            <label htmlFor="picker-r">R</label>
            <input type="text" value={color.r} id="picker-r" />
            <label htmlFor="picker-g">G</label>
            <input type="text" value={color.g} id="picker-g" />
            <label htmlFor="picker-b">B</label>
            <input type="text" value={color.b} id="picker-b" />
            <label htmlFor="picker-hex">#</label>
            <input
              type="text"
              value={color.hex}
              id="picker-b"
              style={{ width: 60 }}
            />
          </div>
        </div>
      </div>
    );
  },

  modify(which) {
    if (this.state.expanded) {
      this.setState({
        expanded: false
      });
    } else {
      this.setState({
        expanded: true,
        modifying: which
      });
    }
  },

  onSliderChange(e) {
    this.setState({
      saturation: parseFloat(e.target.value) / 1000
    });
  },

  componentDidUpdate(prevProps, prevState) {
    let canvas = this.refs.canvas;
    if (canvas && canvas !== this._canvas) {
      this._canvas = canvas;
      this._context = canvas.getContext('2d');
      this._cursor = new CursorTracking(canvas);

      this._cursor.on('scroll:y', this.onPickerScroll);
      this._cursor.on('drag', this.pickerSelect);
      this._cursor.on('mousedown', this.pickerSelect);
      this._cursor.on('mouseup', () => {
        this.props.editor.commitFrame();
      });
    }

    if (this.state.expanded && !prevState.expanded) {
      this.refreshPicker();
    }

    if (this.state.pickerOffset !== prevState.pickerOffset) {
      this.refreshPicker();
    }

    if (this.state.saturation !== prevState.saturation) {
      this.refreshPicker();
    }
  },

  componentDidMount() {
    this.refreshPicker();
  },

  refreshPicker() {
    let canvas = this.refs.canvas;
    if (canvas) {
      let context = this._context;
      context.clearRect(0, 0, PICKER_WIDTH, PICKER_WIDTH);

      let offset = this.state.pickerOffset;

      let yTop = -offset;

      let gradTop = context.createLinearGradient(
        0,
        yTop,
        0,
        yTop + PICKER_HEIGHT
      );
      let gradBottom = context.createLinearGradient(
        0,
        yTop + PICKER_HEIGHT,
        0,
        yTop + PICKER_HEIGHT * 2
      );

      let steps = [
        new Color(255, 0, 0, 1),
        new Color(255, 255, 0, 1),
        new Color(0, 255, 0, 1),
        new Color(0, 255, 255, 1),
        new Color(0, 0, 255, 1),
        new Color(255, 0, 255, 1),
        new Color(255, 0, 0, 1)
      ];

      for (let i = 0; i < steps.length; i++) {
        let c = steps[i].desaturate(1.0 - this.state.saturation);
        gradTop.addColorStop(i / 6, '#' + c.hex);
        gradBottom.addColorStop(i / 6, '#' + c.hex);
      }
      context.fillStyle = gradTop;
      context.fillRect(0, -offset, PICKER_WIDTH, PICKER_HEIGHT);

      context.fillStyle = gradBottom;
      context.fillRect(
        0,
        -offset + PICKER_HEIGHT - 1,
        PICKER_WIDTH,
        PICKER_HEIGHT * 2
      );

      let gradLightDark = context.createLinearGradient(0, 0, PICKER_WIDTH, 0);

      const lightDarkMargin = 0;

      gradLightDark.addColorStop(0 + lightDarkMargin, 'rgba(255,255,255,1)');
      gradLightDark.addColorStop(0.5 - lightDarkMargin, 'rgba(255,255,255,0)');
      gradLightDark.addColorStop(0.5 + lightDarkMargin, 'rgba(0,0,0,0)');
      gradLightDark.addColorStop(1 - lightDarkMargin, 'rgba(0,0,0,1)');

      context.fillStyle = gradLightDark;
      context.fillRect(0, 0, PICKER_WIDTH, PICKER_WIDTH);
    }
  },

  onPickerScroll(e) {
    let pickerOffset = this.state.pickerOffset + e.deltaY;

    pickerOffset %= PICKER_HEIGHT;

    if (pickerOffset < 0) pickerOffset += PICKER_HEIGHT;

    this.setState({
      pickerOffset
    });

    e.stopPropagation();
  },

  pickerSelect(e) {
    let bounds = this._canvas.getBoundingClientRect();
    let x = Math.round(e.clientX - bounds.left);
    let y = Math.round(e.clientY - bounds.top);

    let imgData = this._context.getImageData(x, y, 1, 1).data;
    let color = new Color(imgData[0], imgData[1], imgData[2]);
    this.props.editor.setColor(this.state.modifying, color);
  },

  render() {
    let state = this.props.editor.state;
    let { fill, stroke } = state.colors;
    let strokeWidth = Math.min(6, state.stroke.width * PIXEL_RATIO);

    return (
      <Util title="Style">
        <div className="color-util">
          <div className="color-util__row">
            <div className="color-util__row__label">Fill</div>

            <div className="color-util__row__value">
              <select>
                <option>Solid</option>
                <option>None</option>
              </select>

              <div
                className="color-util__row__swatch"
                style={{
                  background: fill.toString(),
                  border: '1px solid ' + fill.darken(0.2).toString()
                }}
                onClick={() => {
                  this.modify('fill');
                }}
              />
            </div>
          </div>

          {this.renderPicker('fill', fill)}

          <div className="color-util__row">
            <div className="color-util__row__label">Stroke</div>

            <div className="color-util__row__value">
              <select>
                <option>Solid</option>
                <option>None</option>
              </select>

              <div
                className="color-util__row__swatch"
                style={{
                  background: stroke.toString(),
                  border: '1px solid ' + stroke.darken(0.2).toString()
                }}
                onClick={() => {
                  this.modify('stroke');
                }}
              />
            </div>
          </div>

          {this.renderPicker('stroke', stroke)}
        </div>
      </Util>
    );
  }
});

export default ColorUtil;
