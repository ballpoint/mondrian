import consts from 'consts';
import { PIXEL_RATIO } from 'lib/math';
import mathUtils from 'lib/math';
import Posn from 'geometry/posn';
import Item from 'geometry/item';

import Util from 'ui/components/utils/Util';
import TextInput from 'ui/components/utils/TextInput';
import CursorTracking from 'ui/cursor-tracking';
import Color from 'ui/color';
import CanvasLayer from 'ui/layer';
import 'utils/color.scss';

import { ELEMENTS, POINTS, PHANDLE, SHANDLE } from 'ui/selection';

const PICKER_WIDTH = 256;
const PICKER_Y_SCALE = 2;
const PICKER_HEIGHT = PICKER_WIDTH * 3 * PICKER_Y_SCALE;

const VARIOUS = Symbol('various');

class ColorUtil extends React.Component {
  state = {
    expanded: false,
    pickerOffset: 0,

    saturation: 0.5
  };

  componentDidMount() {
    this.props.editor.on('change:selection', () => {
      if (this.state.expanded) {
        this.modify(this.state.modifying, true);
      }
    });
    this.props.editor.on('change:colors', () => {
      if (this.state.expanded) {
        this.modify(this.state.modifying, false);
      }
    });
    this.refreshPicker();
  }

  renderPicker = (which, color) => {
    if (!this.state.expanded) return null;

    if (this.state.modifying !== which) return null;

    if (color.isNone) return null;

    let r = 0;
    let g = 0;
    let b = 0;
    let hex = '000000';

    if (color instanceof Color) {
      r = color.r;
      g = color.g;
      b = color.b;
      hex = color.hex;
    }

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
  };

  toggle = which => {
    if (this.state.modifying === which) {
      this.setState({ expanded: !this.state.expanded });
    } else {
      this.setState({ expanded: true });
    }
  };

  modify = (which, updateSaturation) => {
    let color = this.getColor(which);

    if (this.state.color) {
      if (which === this.state.modifying) {
        if (
          color === this.state.color ||
          (color instanceof Color &&
            this.state.color instanceof Color &&
            color.equal(this.state.color))
        ) {
          // Nothing has changed
          return;
        }
      }
    }

    if (color.isNone || color === VARIOUS) {
      this.setState({ expanded: false });
      return;
    }

    this.setState({ modifying: which });
    this.setColor(which, color, null, { updateSaturation });
  };

  colorModifying = () => {
    return this.getColor(this.state.modifying);
  };

  setColor = (which, color, posn, opts = {}) => {
    let editor = this.props.editor;

    let frame;

    if (
      editor.state.selection.type === ELEMENTS &&
      editor.state.selection.length > 0
    ) {
      frame = this.props.editor.setColor(which, color);
    } else {
      this.props.editor.setDefaultColor(which, color);
    }

    let offset = this.state.pickerOffset;

    if (!posn && !color.isNone) posn = this.posnOfColor(color);

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
  };

  commitColor = () => {
    if (this.state.uncommittedFrame) {
      this.props.editor.commitFrame();
    }
  };

  getColor = which => {
    let editor = this.props.editor;
    let colors = this.getColors(which);

    if (colors.length === 1) {
      let color = colors[0];
      if (color === null) {
        return Color.none();
      } else {
        return color;
      }
    } else {
      return VARIOUS;
    }
  };

  getColors = which => {
    let editor = this.props.editor;
    if (
      editor.state.selection.type === ELEMENTS &&
      editor.state.selection.length > 0
    ) {
      return this.props.editor.state.selection.getAttrValues(Item, which);
    } else {
      return [editor.state.attributes.get(which)];
    }
  };

  onSliderChange = e => {
    let val = parseFloat(e.target.value) / 1000;

    this.setState({
      saturation: val
    });

    e.stopPropagation();
  };

  onSaturationInputChange = val => {
    let sat = parseFloat(val) / 100;
    sat = Math.min(1, Math.max(0, sat));

    this.setState({
      saturation: sat
    });
  };

  onRGBChange = (val, which) => {
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
  };

  onColorModeChange = (e, which) => {
    let editor = this.props.editor;
    let mode = e.target.value;

    editor.state.attributes[which].isNone = which === 'none';
    this.setColor(which, editor.state.attributes[which]);
    this.commitColor();
  };

  onHexChange = val => {
    let color = Color.fromHex(val);

    this.setColor(this.state.modifying, color, null, {
      updateSaturation: true
    });
  };

  componentDidUpdate(prevProps, prevState) {
    let canvas = this.refs.canvas;
    let canvasUi = this.refs.canvasUi;

    let needsRefresh = false;

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

      needsRefresh = true;
    }

    if (this.state.expanded && !prevState.expanded) {
      needsRefresh = true;
    }

    if (this.state.pickerOffset !== prevState.pickerOffset) {
      needsRefresh = true;
    }

    if (this.state.saturation !== prevState.saturation) {
      needsRefresh = true;
    }

    if (this.state.color !== prevState.color) {
      needsRefresh = true;
    }

    /*
    console.log(
      window.performance.now(),
      needsRefresh,
      this.state.color,
      prevState.color
    );
    */

    if (needsRefresh) {
      this.refreshPicker();
    }
  }

  refreshPicker = () => {
    if (!this.state.modifying) return;

    let canvas = this.refs.canvas;
    let selectedColor = this.colorModifying();
    let selectedPosn;

    if (!canvas) return;
    if (selectedColor.isNone) return;

    let context = this._layerGradient.context;
    context.clearRect(0, 0, PICKER_WIDTH, PICKER_WIDTH);

    if (selectedColor !== VARIOUS) {
      selectedPosn = (this.state.posn || this.posnOfColor(selectedColor))
        .clone()
        .nudge(0, -this.state.pickerOffset);

      if (selectedPosn.y < 0) {
        selectedPosn.nudge(0, PICKER_HEIGHT);
      }
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

    if (selectedPosn) {
      this._layerUi.context.strokeStyle =
        selectedColor.lightness() > 0.5 ? 'black' : 'white';

      let rectDimen = 8;

      this._layerUi.context.strokeRect(
        mathUtils.sharpen(selectedPosn.x - 1 - rectDimen / 2),
        mathUtils.sharpen(selectedPosn.y - 1 - rectDimen / 2),
        rectDimen,
        rectDimen
      );
    }
  };

  onPickerScroll = e => {
    let pickerOffset = this.state.pickerOffset + e.deltaY / 2;

    pickerOffset %= PICKER_HEIGHT;

    if (pickerOffset < 0) pickerOffset += PICKER_HEIGHT;

    this.setState({
      pickerOffset
    });

    e.stopPropagation();
  };

  pickerSelect = (e, cursor) => {
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
  };

  posnOfColor = color => {
    if (color === VARIOUS) {
      return new Posn(-1, -1);
    }

    let y = PICKER_HEIGHT * color.hue(); // - this.state.pickerOffset;
    let x = PICKER_WIDTH * (1 - color.lightness());

    if (y < 0) {
      y += PICKER_HEIGHT;
    }

    return new Posn(x, y);
  };

  renderSwatch = (which, color, onClick, mini = false) => {
    let baseClass = `color-util__row__${mini ? 'mini-swatch' : 'swatch'}`;
    if (color.isNone) {
      return (
        <div className={`${baseClass} ${baseClass}--empty`} onClick={onClick}>
          {false ? (
            <svg height="32">
              <line x1={0} y1={30} x2={30} y2={0} />
            </svg>
          ) : null}
        </div>
      );
    } else {
      return (
        <div
          key={which + ':' + color.hex}
          className={baseClass}
          style={{
            background: color.toString(),
            border: '1px solid ' + color.darken(0.2).toString()
          }}
          onClick={onClick}
        />
      );
    }
  };

  renderSection = which => {
    let colors = this.getColors(which);
    let color;

    let selector;
    let swatch;
    if (colors.length === 1) {
      color = colors[0];
      selector = (
        <select
          onChange={e => {
            this.onColorModeChange(e, which);
          }}
          value={color.isNone ? 'none' : 'solid'}>
          <option value="solid">Solid</option>
          <option value="none">None</option>
        </select>
      );

      swatch = this.renderSwatch(which, color, () => {
        this.modify(which, true);
        this.toggle(which);
      });
    } else {
      selector = (
        <div className="color-util__row__mini-swatches">
          {colors.map(color => {
            return this.renderSwatch(
              which,
              color,
              () => {
                this.props.editor.narrowSelectionByAttr(which, color);
              },
              true
            );
          })}
        </div>
      );

      color = VARIOUS;

      swatch = this.renderSwatch(which, Color.none(), () => {
        this.setState({ modifying: which });
        this.toggle(which);
      });
    }

    return [
      <div className="color-util__row" key={`${which}-row`}>
        <div className="color-util__row__label">
          {{ fill: 'Fill', stroke: 'Stroke' }[which]}
        </div>

        <div className="color-util__row__value" key={`${which}-picker`}>
          {selector}
          {swatch}
        </div>
      </div>,

      this.renderPicker(which, color)
    ];
  };

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
}

export default ColorUtil;
