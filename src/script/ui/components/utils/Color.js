import { PIXEL_RATIO } from 'lib/math';
import mathUtils from 'lib/math';
import Posn from 'geometry/posn';
import Util from 'ui/components/utils/Util';
import CursorTracking from 'ui/cursor-tracking';
import Color from 'ui/color';
import CanvasLayer from 'ui/layer';
import 'utils/color.scss';

const PICKER_WIDTH = 256;
const PICKER_Y_SCALE = 2;
const PICKER_HEIGHT = PICKER_WIDTH * 3 * PICKER_Y_SCALE;

let ColorUtil = React.createClass({
  getInitialState() {
    return {
      expanded: false,
      pickerOffset: 0,
      saturation: 0.5
    };
  },

  componentDidMount() {
    this.props.editor.on('change:selection', () => {
      console.log('shit', this.state);
      if (this.state.expanded) {
        this.modify(this.state.modifying);
      }
    });
    this.refreshPicker();
  },

  renderPicker(which, color) {
    if (!this.state.expanded) return null;

    if (this.state.modifying !== which) return null;

    return (
      <div className="color-util__modify">
        <div className="color-util__picker">
          <div className="color-util__canvas-container">
            <canvas width={PICKER_WIDTH} height={PICKER_WIDTH} ref="canvas" />
            <canvas width={PICKER_WIDTH} height={PICKER_WIDTH} ref="canvasUi" />
          </div>

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

  toggle(which) {
    if (this.state.modifying === which) {
      this.setState({ expanded: !this.state.expanded });
    } else {
      this.setState({ expanded: true });
    }
  },

  modify(which) {
    let color = this.getColor(which);
    // Jump offset
    let offset = PICKER_HEIGHT * color.hue() - PICKER_WIDTH / 2;
    if (offset < PICKER_WIDTH) offset += PICKER_HEIGHT;

    this.setState({
      modifying: which,
      color,
      pickerOffset: offset,
      saturation: color.saturation()
    });
  },

  colorModifying() {
    return this.getColor(this.state.modifying);
  },

  getColor(which) {
    let editor = this.props.editor;
    if (editor.state.selection.length > 0) {
      return editor.state.selection[0].data[which];
    } else {
      return editor.state.colors[which];
    }
  },

  onSliderChange(e) {
    this.setState({
      saturation: parseFloat(e.target.value) / 1000
    });
  },

  componentDidUpdate(prevProps, prevState) {
    let canvas = this.refs.canvas;
    let canvasUi = this.refs.canvasUi;

    if (canvas && canvas !== this._canvas) {
      this._layerGradient = new CanvasLayer('gradient', canvas);
      this._layerUi = new CanvasLayer('ui', canvasUi);

      this._canvas = canvas;
      this._canvasUi = canvasUi;

      this._cursor = new CursorTracking(canvasUi);

      this._cursor.on('scroll:y', this.onPickerScroll);
      this._cursor.on('drag', this.pickerSelect);
      this._cursor.on('mousedown', this.pickerSelect);
      this._cursor.on('mouseup', () => {
        if (this.props.editor.state.selection.length > 0) {
          this.props.editor.commitFrame();
        }
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

  refreshPicker() {
    let canvas = this.refs.canvas;
    if (canvas) {
      let context = this._layerGradient.context;
      context.clearRect(0, 0, PICKER_WIDTH, PICKER_WIDTH);

      let selectedColor = this.colorModifying();
      let selectedPosn = this.posnOfColor(selectedColor);

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

      gradLightDark.addColorStop(0, 'rgba(255,255,255,1)');
      gradLightDark.addColorStop(0.5, 'rgba(255,255,255,0)');
      gradLightDark.addColorStop(0.5, 'rgba(0,0,0,0)');
      gradLightDark.addColorStop(1, 'rgba(0,0,0,1)');

      context.fillStyle = gradLightDark;
      context.fillRect(0, 0, PICKER_WIDTH, PICKER_WIDTH);

      this._layerUi.context.clearRect(0, 0, PICKER_WIDTH, PICKER_WIDTH);
      this._layerUi.context.strokeStyle =
        selectedColor.lightness() > 0.5 ? 'black' : 'white';

      let rectDimen = 8;

      this._layerUi.context.strokeRect(
        mathUtils.sharpen(selectedPosn.x - rectDimen / 2),
        mathUtils.sharpen(selectedPosn.y - rectDimen / 2),
        rectDimen,
        rectDimen
      );
    }
  },

  onPickerScroll(e) {
    let pickerOffset = this.state.pickerOffset + e.deltaY / 2;

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

    let imgData = this._layerGradient.context.getImageData(x, y, 1, 1).data;
    let color = new Color(imgData[0], imgData[1], imgData[2]);
    this.props.editor.setColor(this.state.modifying, color);

    this.refreshPicker();
  },

  posnOfColor(color) {
    let y = PICKER_HEIGHT * color.hue() - this.state.pickerOffset;
    let x = PICKER_WIDTH * (1 - color.lightness());

    if (y < 0) {
      y += PICKER_HEIGHT;
    }

    return new Posn(x, y);
  },

  render() {
    let state = this.props.editor.state;
    let fill = this.getColor('fill');
    let stroke = this.getColor('stroke');
    let strokeWidth = Math.min(6, state.stroke.width * PIXEL_RATIO);

    return (
      <Util title="Color">
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
                  this.toggle('fill');
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
                  this.toggle('stroke');
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
