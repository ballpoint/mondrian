import classnames from 'classnames';
import Thumb from 'ui/thumb';
import 'utils/selection.scss';
import Util from 'ui/components/Util';
import TextInput from 'ui/components/TextInput';

let SelectionUtil = React.createClass({
  getInitialState() {
    return {
      cachedThumbnail: null,
      originId: 'tl',
    }
  },

  renderSubheader() {
    let sel = this.props.editor.state.selection;
    let subheader;
    if (sel.length === 0) {
      subheader = 'Document'
    } else  if (sel.length === 1) {
      subheader = sel[0].constructor.name +' '+sel[0]._i
    } else if (sel.length > 1) {
      subheader = sel.length + ' items'
    }

    return <div className="sel-util__subheader">{subheader}</div>;
  },

  getSelectionIdKey() {
    let { state } = this.props.editor;
    if (state.selectionType === 'ELEMENTS') {
      return state.selection.map((e) => { return e.__id__ }).sort().join(',');
    } else {
      return '';
    }
  },

  componentDidMount() {
    this._clearCachedThumbnailDebounced = _.debounce(() => {
      this.setState({ cachedThumbnail: null });
    }, 250);
  },

  componentWillReceiveProps(prevState) {
    // Handle changing the thumbnail. Debounce if selection ids haven't changed.
    let selectionKey = this.getSelectionIdKey();

    if (selectionKey === this.state.selectionKey) {
      this._clearCachedThumbnailDebounced();
    } else {
      this.setState({ cachedThumbnail: null });
    }

    this.setState({ selectionKey });
  },

  onChangeCoord(val, which) {
    let xd = 0, yd = 0;
    let { state, doc } = this.props.editor;
    if (state.selectionBounds) {
      let bounds = state.selectionBounds.bounds;
      let origin = this.getOrigin(bounds);
      switch (which) {
        case 'x':
          xd = val - origin.x;
          break;
        case 'y':
          yd = val - origin.y;
          break;
      }
      if (xd !== 0 || yd !== 0) {
        this.props.editor.nudgeSelected(xd, yd);
      }
    }
  },

  onChangeScale(val, which) {
    let xs = 1, ys = 1;
    let { state, doc } = this.props.editor;
    if (state.selectionBounds) {
      let bounds = state.selectionBounds.bounds;
      let origin = this.getOrigin(bounds);
      switch (which) {
        case 'w':
          xs = val / bounds.width;
          break;
        case 'h':
          ys = val / bounds.height;
          break;
      }
      if (xs !== 1 || ys !== 1) {
        this.setState({ cachedThumbnail: null });
        this.props.editor.scaleSelected(xs, ys, origin);
      }
    }
  },

  getThumbnail() {
    if (this.state.cachedThumbnail) return this.state.cachedThumbnail;

    this.state.cachedThumbnail = Thumb.fromElements(this.props.editor.state.selection);
    return this.state.cachedThumbnail;
  },

  renderOriginButton(id) {
    return (
      <div
        className={
          classnames({
            "sel-util__thumb__origin-button": true,
            ["sel-util__thumb__origin-button--"+id]: true,
            "sel-util__thumb__origin-button--active": this.state.originId === id
          })
        }
        onClick={() => { this.setState({ originId: id }) }}
      />
    );
  },

  renderThumb() {
    let { state, doc } = this.props.editor;

    if (state.selectionType === 'ELEMENTS' && state.selection.length > 0) {
      let thumb = this.getThumbnail();
      return (
        <div className="sel-util__thumb">
          <div className="sel-util__thumb__img">
            <img src={thumb.url} />
            <div className="sel-util__thumb__height-bracket"></div>
            <div className="sel-util__thumb__width-bracket"></div>

            <div className="sel-util__thumb__origin-buttons">
              {this.renderOriginButton('tl')}
              {this.renderOriginButton('tr')}
              {this.renderOriginButton('c')}
              {this.renderOriginButton('br')}
              {this.renderOriginButton('bl')}
            </div>
          </div>
        </div>
      );
    } else {
      return null;
    }
  },

  getOrigin(bounds) {
    switch (this.state.originId) {
      case 'tl':
        return bounds.tl();
      case 'tr':
        return bounds.tr();
      case 'bl':
        return bounds.bl();
      case 'br':
        return bounds.br();
      case 'c':
        return bounds.center();
    }
  },

  renderCoords() {
    let { state, doc } = this.props.editor;
    if (state.selectionBounds) {
      let bounds = state.selectionBounds.bounds;

      if (bounds) {
        let origin = this.getOrigin(bounds);
        return (
          <div className="sel-util__coords">
            <div className="sel-util__coords__x-input">
              <TextInput label="x" id="selection-x" value={origin.x} onSubmit={(val) => { this.onChangeCoord(val, 'x') }} />
            </div>
            <div className="sel-util__coords__y-input">
              <TextInput label="y" id="selection-y" value={origin.y} onSubmit={(val) => { this.onChangeCoord(val, 'y') }} />
            </div>
          </div>
        );
      }
    }

    return null;
  },

  renderHeight() {
    let { state, doc } = this.props.editor;
    if (state.selectionBounds) {
      let bounds = state.selectionBounds.bounds;

      if (bounds) {
        return (
          <div className="sel-util__height">
            <div className="sel-util__height__input">
              <TextInput id="selection-h" value={bounds.height} onSubmit={(val) => { this.onChangeScale(val, 'h') }} />
            </div>
          </div>
        );
      }
    }
    return null;
  },

  renderWidth() {
    let { state, doc } = this.props.editor;
    if (state.selectionBounds) {
      let bounds = state.selectionBounds.bounds;

      if (bounds) {
        return (
          <div className="sel-util__width">
            <div className="sel-util__width__input">
              <TextInput id="selection-w" value={bounds.width} onSubmit={(val) => { this.onChangeScale(val, 'w') }} />
            </div>
          </div>
        );
      }
    }
    return null;
  },

  render() {
    return (
      <Util title="Selection">
        <div className="sel-util">
          <div className="sel-util__main">
            <div className="sel-util__top">
              { this.renderCoords() }
              { this.renderThumb() }
              { this.renderHeight() }
            </div>
            <div className="sel-util__middle">
              { this.renderWidth() }
            </div>
          </div>
          <div className="sel-util__bottom">
            { this.renderSubheader() }
          </div>
        </div>
      </Util>
    );
  }
});

export default SelectionUtil;
