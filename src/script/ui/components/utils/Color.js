import consts from 'consts';
import { PIXEL_RATIO } from 'lib/math';
import mathUtils from 'lib/math';
import Posn from 'geometry/posn';
import Util from 'ui/components/utils/Util';
import TextInput from 'ui/components/utils/TextInput';
import CursorTracking from 'ui/cursor-tracking';
import Color from 'ui/color';
import { NONE } from 'ui/color';
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
      if (this.state.expanded) {
        this.modify(this.state.modifying);
      }
    });
    this.props.editor.on('change:colors', () => {
      if (this.state.expanded) {
        this.modify(this.state.modifying);
      }
    });
    this.refreshPicker();
  },

  renderPicker(which, color) {
    if (!this.state.expanded) return null;

    if (this.state.modifying !== which) return null;

    if (color === NONE) return null;

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

            <TextInput
              width={40}
              value={(this.state.saturation * 100).toFixed(1)}
              onSubmit={this.onSaturationInputChange}
            />
          </div>
          <div className="color-util__picker__rgb">
            <label htmlFor="picker-r">R</label>
            <TextInput
              width={30}
              value={color.r}
              id="picker-r"
              onSubmit={val => {
                this.onRGBChange(val, 'r');
              }}
              onBlur={this.commitColor}
            />
            <label htmlFor="picker-g">G</label>
            <TextInput
              width={30}
              value={color.g}
              id="picker-g"
              onSubmit={val => {
                this.onRGBChange(val, 'g');
              }}
              onBlur={this.commitColor}
            />
            <label htmlFor="picker-b">B</label>
            <TextInput
              width={30}
              value={color.b}
              id="picker-b"
              onSubmit={val => {
                this.onRGBChange(val, 'b');
              }}
              onBlur={this.commitColor}
            />
            <label htmlFor="picker-hex">#</label>
            <TextInput
              value={color.hex}
              id="picker-b"
              style={{ width: 60 }}
              onSubmit={this.onHexChange}
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

    if (this.state.color) {
      if (which === this.state.modifying && color.equal(this.state.color)) {
        // Nothing has changed
        return;
      }
    }

    this.setState({ modifying: which });
    this.setColor(which, color, null, { updateSaturation: true });
  },

  colorModifying() {
    return this.getColor(this.state.modifying);
  },

  setColor(which, color, posn, opts = {}) {
    let editor = this.props.editor;

    let frame;

    if (
      editor.state.selectionType === 'ELEMENTS' &&
      editor.state.selection.length > 0
    ) {
      frame = this.props.editor.setColor(which, color);
    } else {
      this.props.editor.setColorState(which, color);
    }

    let offset = this.state.pickerOffset;

    if (!posn && color !== NONE) posn = this.posnOfColor(color);

    if (posn) {
      // Jump offset
      if (posn.y < offset || posn.y > offset + PICKER_WIDTH) {
        offset = posn.y - PICKER_WIDTH / 2;
        if (offset < PICKER_WIDTH) offset += PICKER_HEIGHT;
      }
    }

    this.setState({
      color,
      posn,
      pickerOffset: offset
    });

    this.state.uncommittedFrame = frame;

    if (opts.updateSaturation) {
      this.setState({
        saturation: color.saturation()
      });
    }

    this.refreshPicker();
  },

  commitColor() {
    if (this.state.uncommittedFrame) {
      this.props.editor.commitFrame();
    }
  },

  getColor(which) {
    let editor = this.props.editor;
    if (
      editor.state.selectionType === 'ELEMENTS' &&
      editor.state.selection.length > 0
    ) {
      return editor.state.selection[0].data[which];
    } else {
      return editor.state.colors[which];
    }
  },

  onSliderChange(e) {
    let val = parseFloat(e.target.value) / 1000;

    this.setState({
      saturation: val
    });
  },

  onSaturationInputChange(val) {
    let sat = parseFloat(val) / 100;
    sat = Math.min(1, Math.max(0, sat));

    this.setState({
      saturation: sat
    });
  },

  onRGBChange(val, which) {
    val = parseInt(val);
    val = Math.max(0, Math.min(255, val));

    let { r, g, b } = this.state.color;
    switch (which) {
      case 'r':
        r = val;
        break;
      case 'g':
        g = val;
        break;
      case 'b':
        b = val;
        break;
    }

    let color = new Color(r, g, b);

    this.setColor(this.state.modifying, color, null, {
      updateSaturation: true
    });

    this.commitColor();
  },

  onColorModeChange(e, which) {
    let editor = this.props.editor;
    let mode = e.target.value;
    switch (mode) {
      case 'none':
        this.setColor(which, NONE);
        break;
      case 'solid':
        editor.state.colors.setMode(which, 'solid');
        this.setColor(which, editor.state.colors[which]);
        break;
    }

    this.commitColor();
  },

  onHexChange(val) {
    let color = Color.fromHex(val);

    this.setColor(this.state.modifying, color, null, {
      updateSaturation: true
    });
  },

  componentDidUpdate(prevProps, prevState) {
    let canvas = this.refs.canvas;
    let canvasUi = this.refs.canvasUi;

    if (canvas && canvas !== this._canvas) {
      this._layerGradient = new CanvasLayer('gradient', canvas);
      this._layerUi = new CanvasLayer('ui', canvasUi);

      this._layerGradient.setDimensions(PICKER_WIDTH, PICKER_WIDTH);
      this._layerUi.setDimensions(PICKER_WIDTH, PICKER_WIDTH);

      this._canvas = canvas;
      this._canvasUi = canvasUi;

      this._cursor = new CursorTracking(canvasUi);

      this._cursor.on('scroll:y', this.onPickerScroll);
      this._cursor.on('drag', this.pickerSelect);
      this._cursor.on('mousedown', this.pickerSelect);
      this._cursor.on('mouseup', () => {
        this.commitColor();
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
    let selectedColor = this.colorModifying();

    if (!canvas) return;
    if (selectedColor === NONE) return;

    let context = this._layerGradient.context;
    context.clearRect(0, 0, PICKER_WIDTH, PICKER_WIDTH);

    let selectedPosn = (this.state.posn || this.posnOfColor(selectedColor))
      .clone()
      .nudge(0, -this.state.pickerOffset);

    if (selectedPosn.y < 0) {
      selectedPosn.nudge(0, PICKER_HEIGHT);
    }

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
      mathUtils.sharpen(selectedPosn.x - 1 - rectDimen / 2),
      mathUtils.sharpen(selectedPosn.y - 1 - rectDimen / 2),
      rectDimen,
      rectDimen
    );
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

  pickerSelect(e, cursor) {
    let bounds = this._canvas.getBoundingClientRect();
    let x = Math.round(e.clientX - bounds.left);
    let y = Math.round(e.clientY - bounds.top);

    x = Math.max(0, Math.min(PICKER_WIDTH, x));
    y = Math.max(0, Math.min(PICKER_WIDTH, y));

    let posn = new Posn(x, y + this.state.pickerOffset);

    let imgData = this._layerGradient.context.getImageData(
      x * PIXEL_RATIO,
      y * PIXEL_RATIO,
      1,
      1
    ).data;

    let color = new Color(imgData[0], imgData[1], imgData[2]);

    this.setColor(this.state.modifying, color, posn);
  },

  posnOfColor(color) {
    let y = PICKER_HEIGHT * color.hue(); // - this.state.pickerOffset;
    let x = PICKER_WIDTH * (1 - color.lightness());

    if (y < 0) {
      y += PICKER_HEIGHT;
    }

    return new Posn(x, y);
  },

  renderSwatch(which, color) {
    if (color === NONE) {
      return (
        <div
          className="color-util__row__swatch"
          style={{
            border: '1px solid #ccc'
          }}
        />
      );
    } else {
      return (
        <div
          className="color-util__row__swatch"
          style={{
            background: color.toString(),
            border: '1px solid ' + color.darken(0.2).toString()
          }}
          onClick={() => {
            this.modify(which);
            this.toggle(which);
          }}
        />
      );
    }
  },

  renderSection(which) {
    let color = this.getColor(which);

    return [
      <div className="color-util__row">
        <div className="color-util__row__label">
          {{ fill: 'Fill', stroke: 'Stroke' }[which]}
        </div>

        <div className="color-util__row__value">
          <select
            onChange={e => {
              this.onColorModeChange(e, which);
            }}>
            <option value="solid" selected={color !== NONE}>
              Solid
            </option>
            <option value="none" selected={color === NONE}>
              None
            </option>
          </select>

          {this.renderSwatch(which, color)}
        </div>
      </div>,

      this.renderPicker(which, color)
    ];
  },

  render() {
    return (
      <Util title="Color">
        <div className="color-util">
          {this.renderSection('fill')}
          {this.renderSection('stroke')}
        </div>
      </Util>
    );
  }
});

export default ColorUtil;
