import Thumb from 'ui/thumb';
import 'utils/selection.scss';
import Util from 'ui/components/Util';
import TextInput from 'ui/components/TextInput';

let SelectionUtil = React.createClass({
  getInitialState() {
    return {
      cachedThumbnail: null
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
      switch (which) {
        case 'x':
          xd = val - bounds.x;
          break;
        case 'y':
          yd = val - bounds.y;
          break;
      }
      this.props.editor.nudgeSelected(xd, yd);
    }
  },

  onChangeScale(val, which) {
    let xs = 1, ys = 1;
    let { state, doc } = this.props.editor;
    if (state.selectionBounds) {
      let bounds = state.selectionBounds.bounds;
      switch (which) {
        case 'w':
          xs = val / bounds.width;
          break;
        case 'h':
          ys = val / bounds.height;
          break;
      }
      this.setState({ cachedThumbnail: null });
      this.props.editor.scaleSelected(xs, ys, bounds.tl());
    }
  },

  getThumbnail() {
    if (this.state.cachedThumbnail) return this.state.cachedThumbnail;

    this.state.cachedThumbnail = Thumb.fromElements(this.props.editor.state.selection);
    return this.state.cachedThumbnail;
  },

  renderThumb() {
    let { state, doc } = this.props.editor;
    let thumb = this.getThumbnail();
    if (state.selectionType === 'ELEMENTS' && state.selection.length > 0) {
      return (
        <div className="sel-util__thumb">
          <div className="sel-util__thumb__img">
            <img src={thumb.url} />
            <div className="sel-util__thumb__height-bracket"></div>
            <div className="sel-util__thumb__width-bracket"></div>
          </div>
        </div>
      );
    } else {
      return null;
    }
  },

  renderCoords() {
    let { state, doc } = this.props.editor;
    if (state.selectionBounds) {
      let bounds = state.selectionBounds.bounds;

      if (bounds) {
        return (
          <div className="sel-util__coords">
            <div className="sel-util__coords__x-input">
              <TextInput label="x" id="selection-x" value={bounds.x} onSubmit={(val) => { this.onChangeCoord(val, 'x') }} />
            </div>
            <div className="sel-util__coords__y-input">
              <TextInput label="y" id="selection-y" value={bounds.y} onSubmit={(val) => { this.onChangeCoord(val, 'y') }} />
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
            { false ? this.renderSubheader() : null }
          </div>
        </div>
      </Util>
    );
  }
});

export default SelectionUtil;
