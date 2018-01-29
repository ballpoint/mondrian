import 'dialogs/dialogs.scss';
import units from 'lib/units';
import TextInput from 'ui/components/utils/TextInput';
import localForage from 'localforage';

class DocPreset {
  constructor(name, unit, w, h) {
    this.name = name;
    this.unit = unit;
    this.width = w;
    this.height = h;
  }
}

const printPresets = [
  new DocPreset('US Letter', units.IN, 8.5, 11),
  new DocPreset('US Half Letter', units.IN, 5.5, 8.5),
  new DocPreset('US Ledger/Tabloid', units.IN, 11, 17),
  new DocPreset('A0', units.MM, 841, 1189),
  new DocPreset('A1', units.MM, 594, 841),
  new DocPreset('A2', units.MM, 420, 594),
  new DocPreset('A3', units.MM, 297, 420),
  new DocPreset('A4', units.MM, 210, 297),
  new DocPreset('A5', units.MM, 148, 210),
  new DocPreset('A6', units.MM, 105, 148),
  new DocPreset('A7', units.MM, 74, 105),
  new DocPreset('A8', units.MM, 52, 74),
  new DocPreset('A9', units.MM, 37, 52),
  new DocPreset('A10', units.MM, 26, 37)
];

class MediaOption extends React.Component {
  render() {
    return (
      <div href="#" className="new-doc-media-option" title={this.props.hint}>
        <input
          type="radio"
          name="media"
          id={this.props.id}
          checked={this.props.selected === this.props.value}
          onChange={e => {
            if (e.target.checked) {
              this.props.setMedia(this.props.value);
            }
          }}
        />
        <label htmlFor={this.props.id}>
          <strong>{this.props.unit}</strong>
          {this.props.label}
        </label>
      </div>
    );
  }
}

class NewDocumentDialog extends React.Component {
  constructor() {
    super();

    this.state = {
      media: 'digital',
      width: 600,
      height: 400,
      unit: 'px'
    };
  }

  async create() {
    // sds
    let params = await this.cacheConfiguration();
    this.props.create(params);
    this.props.close();
  }

  async cacheConfiguration() {
    let store = localForage.createInstance({ name: 'editor' });

    let width, height;
    let unit;

    if (this.state.printPreset) {
      unit = this.state.printPreset.unit;
      width = units.toPt(this.state.printPreset.width, unit);
      height = units.toPt(this.state.printPreset.height, unit);
    } else {
      width = this.state.width;
      height = this.state.height;
      unit = this.state.unit;
    }

    let params = {
      media: this.state.media,
      width,
      height,
      unit
    };

    await store.setItem('newDocumentParams', params);

    return params;
  }

  renderPresetOptions() {
    if (this.state.media === 'print') {
      return (
        <div className="new-doc-options-row new-doc-options-row--solo">
          <legend>Preset</legend>

          <article>
            <select
              onChange={e => {
                console.log(e.target.value);

                for (let preset of printPresets) {
                  if (preset.name === e.target.value) {
                    this.setState({
                      printPreset: preset
                    });
                  }
                }
              }}>
              {printPresets.map(preset => {
                return <option>{preset.name}</option>;
              })}
            </select>
          </article>
        </div>
      );
    } else {
      return null;
    }
  }

  renderWidth() {
    let w;

    if (this.state.printPreset) {
      w = this.state.printPreset.width;
    } else {
      w = (
        <TextInput
          value={this.state.width}
          onSubmit={v => {
            this.setState({ width: parseFloat(v) });
          }}
        />
      );
    }

    return (
      <div className="new-doc-options-row">
        <legend>Width</legend>

        <article>{w}</article>
      </div>
    );
  }

  renderHeight() {
    let h;

    if (this.state.printPreset) {
      h = this.state.printPreset.height;
    } else {
      h = (
        <TextInput
          value={this.state.height}
          onSubmit={v => {
            this.setState({ height: parseFloat(v) });
          }}
        />
      );
    }

    return (
      <div className="new-doc-options-row">
        <legend>Height</legend>

        <article>{h}</article>
      </div>
    );
  }

  renderUnit() {
    let u;

    if (this.state.media === 'print') {
      if (this.state.printPreset) {
        u = this.state.printPreset.unit;
      } else {
        u = (
          <select>
            <option>xasa</option>
          </select>
        );
      }
    } else {
      u = 'px';
    }

    return (
      <div className="new-doc-options-row">
        <legend>Unit</legend>

        <article>{u}</article>
      </div>
    );
  }

  render() {
    return (
      <div className="new-doc-dialog">
        <div className="dialog-body">
          <div className="new-doc-options">
            <div className="new-doc-options-row new-doc-options-row--solo">
              <legend>Media</legend>

              <article>
                <MediaOption
                  id="media-digital"
                  value="digital"
                  selected={this.state.media}
                  label="Digital"
                  unit="px"
                  hint="Digital mode is for work that will be viewed on a screen"
                  setMedia={media => {
                    this.setState({ media, printPreset: null });
                  }}
                />
                <MediaOption
                  id="media-print"
                  value="print"
                  selected={this.state.media}
                  label="Print"
                  unit="pt"
                  hint="Print mode is for work that will be be printed out"
                  setMedia={media => {
                    this.setState({ media, printPreset: printPresets[0] });
                  }}
                />
              </article>
            </div>

            {this.renderPresetOptions()}

            {this.renderWidth()}
            {this.renderHeight()}
            {this.renderUnit()}
          </div>
          <div className="new-doc-preview">
            <div
              className="new-doc-preview-outline"
              style={{
                width: 85,
                height: 110
              }}
            />
          </div>
        </div>
        <div className="dialog-buttons">
          <button onClick={this.props.close}>Cancel</button>
          <button onClick={this.create.bind(this)}>Create</button>
        </div>
      </div>
    );
  }
}

export default NewDocumentDialog;
