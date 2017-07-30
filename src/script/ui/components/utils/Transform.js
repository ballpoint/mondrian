import classnames from 'classnames';
import Thumb from 'ui/thumb';
import Layer from 'ui/layer';
import 'utils/selection.scss';
import Util from 'ui/components/utils/Util';
import TextInput from 'ui/components/utils/TextInput';

const THUMB_IMG_MAX_WIDTH  = 140;
const THUMB_IMG_MAX_HEIGHT = 100;

let TransformUtil = React.createClass({
  getInitialState() {
    return {
      cachedThumbnail: null,
      originId: 'tl',
    }
  },

  shouldComponentUpdate(nextProps, nextState) {
    if (!this.props.selectionBounds || nextProps.selectionBounds) {
      return true;
    } else {
      return !this.props.selectionBounds.bounds.equal(nextProps.selectionBounds.bounds);
    }
    return true;
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

  componentDidUpdate() {
    let thumb = this.getThumbnail();
    let canvas = ReactDOM.findDOMNode(this.refs.thumbnail);

    if (canvas) {
      thumb.drawTo(new Layer('thumb', canvas));
    }
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

    this.state.cachedThumbnail = new Thumb(this.props.editor.state.selection, {
      maxWidth: 140,
      maxHeight: 100
    });
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

    let img;
    let brackets;

    if (!doc) return;

    if (state.selection.length === 0) {
      let docBounds = doc.bounds.fitToDimensions(THUMB_IMG_MAX_WIDTH, THUMB_IMG_MAX_HEIGHT);

      return (
        <div className="sel-util__thumb">
          <div className="sel-util__thumb__img">
            <div className="sel-util__thumb__img--doc"
              style={
                {
                  width:  docBounds.width,
                  height: docBounds.height,
                }
              }
            >
            </div>
          </div>
        </div>
      );

    } else {
      if (state.selectionType === 'ELEMENTS') {
        let thumb = this.getThumbnail();
        return (
          <div className="sel-util__thumb">
            <div className="sel-util__thumb__img">
              <canvas ref="thumbnail" />
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
      } else if (state.selectionType === 'POINTS') {
        return (
          <div className="sel-util__thumb">
            <div className="sel-util__thumb__img">
            </div>
          </div>
        )
      }
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
    if (!doc) return;

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
    if (!doc) return;

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
      <Util title="Transform">
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

export default TransformUtil;
