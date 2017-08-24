import classnames from 'classnames';
import Bounds from 'geometry/bounds';
import Thumb from 'ui/thumb';
import Layer from 'ui/layer';
import 'utils/selection.scss';
import Util from 'ui/components/utils/Util';
import Projection from 'ui/projection';
import TextInput from 'ui/components/utils/TextInput';

const THUMB_IMG_MAX_WIDTH = 120;
const THUMB_IMG_MAX_HEIGHT = 80;

let TransformUtil = React.createClass({
  getInitialState() {
    return {
      originId: 'tl'
    };
  },

  shouldComponentUpdate(nextProps, nextState) {
    if (!this.props.selectionBounds || nextProps.selectionBounds) {
      return true;
    } else {
      return !this.props.selectionBounds.bounds.equal(
        nextProps.selectionBounds.bounds
      );
    }
    return true;
  },

  renderSubheader() {
    let sel = this.props.editor.state.selection;
    let subheader;
    if (sel.length === 0) {
      subheader = 'Document';
    } else if (sel.length === 1) {
      subheader = sel[0].constructor.name + ' ' + sel[0]._i;
    } else if (sel.length > 1) {
      subheader = sel.length + ' items';
    }

    return (
      <div className="sel-util__subheader">
        {subheader}
      </div>
    );
  },

  getSelectionIdKey() {
    let { state } = this.props.editor;
    if (state.selectionType === 'ELEMENTS') {
      return state.selection
        .map(e => {
          return e.__id__;
        })
        .sort()
        .join(',');
    } else {
      return '';
    }
  },

  componentDidUpdate() {
    let canvas = ReactDOM.findDOMNode(this.refs.thumbnail);

    if (canvas) {
      let thumb = this.getThumbnail();
      thumb.drawTo(new Layer('thumb', canvas));
    }
  },

  componentWillReceiveProps(prevState) {
    // Handle changing the thumbnail. Debounce if selection ids haven't changed.
    let selectionKey = this.getSelectionIdKey();
    this.setState({ selectionKey });
  },

  onChangeCoord(val, which) {
    let xd = 0,
      yd = 0;
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
        this.props.editor.commitFrame();
      }
    }
  },

  onChangeScale(val, which) {
    let xs = 1,
      ys = 1;
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
        this.props.editor.scaleSelected(xs, ys, origin);
        this.props.editor.commitFrame();
      }
    }
  },

  getThumbnail() {
    return new Thumb(this.props.editor.state.selection, {
      maxWidth: THUMB_IMG_MAX_WIDTH,
      maxHeight: THUMB_IMG_MAX_HEIGHT
    });
  },

  renderOriginButton(id) {
    return (
      <div
        className={classnames({
          'sel-util__thumb__origin-button': true,
          ['sel-util__thumb__origin-button--' + id]: true,
          'sel-util__thumb__origin-button--active': this.state.originId === id
        })}
        onClick={() => {
          this.setState({ originId: id });
        }}
      />
    );
  },

  renderThumb() {
    let { state, doc } = this.props.editor;
    let bounds = state.selectionBounds.bounds;

    let img;
    let brackets;

    if (!doc) return;

    if (state.selection.length === 0) {
      let docBounds = doc.bounds.fitToDimensions(
        THUMB_IMG_MAX_WIDTH,
        THUMB_IMG_MAX_HEIGHT
      );

      return (
        <div className="sel-util__thumb">
          <div className="sel-util__thumb__img">
            <div className="sel-util__thumb__height-bracket" />
            <div className="sel-util__thumb__width-bracket" />
            <div
              className="sel-util__thumb__img--doc"
              style={{
                width: docBounds.width,
                height: docBounds.height
              }}
            />
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
              <div className="sel-util__thumb__height-bracket" />
              <div className="sel-util__thumb__width-bracket" />

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
        // If we have more than one point, we draw their thumbnail
        // Otherwise, we render point + handle circle controls

        return (
          <div className="sel-util__thumb">
            {this.renderPoints(state.selection)}

            {bounds.height > 0
              ? <div className="sel-util__thumb__height-bracket" />
              : null}
            {bounds.width > 0
              ? <div className="sel-util__thumb__width-bracket" />
              : null}
          </div>
        );
      }
    }
  },

  renderPoints(points) {
    let { state, doc } = this.props.editor;
    let bounds = state.selectionBounds.bounds;

    if (points.length === 1) {
      let point = points[0];
      let width = Math.max(bounds.width, 5);
      let height = Math.max(bounds.height, 5);

      let posns = [point];
      if (point.pHandle) {
        posns.push(point.pHandle);
      }
      if (point.sHandle) {
        posns.push(point.sHandle);
      }

      let projection = Projection.forBoundsFit(
        Bounds.fromPosns(posns),
        THUMB_IMG_MAX_WIDTH,
        THUMB_IMG_MAX_HEIGHT
      );

      console.log(projection.width, projection.height);

      let mainHandle, pHandle, sHandle;

      function drawPosn(posn, isMain = false) {
        return (
          <div
            className={classnames({
              'sel-util__thumb__point': true,
              'is-main': isMain
            })}
            style={{
              position: 'absolute',
              left: projection.x(posn.x),
              top: projection.y(posn.y)
            }}
          />
        );
      }

      mainHandle = drawPosn(point, true);
      if (point.pHandle) {
        pHandle = drawPosn(point.pHandle);
      }
      if (point.sHandle) {
        sHandle = drawPosn(point.sHandle);
      }

      return (
        <div
          className="sel-util__thumb__point-container"
          style={{ width: projection.width, height: projection.height }}>
          {pHandle}
          {mainHandle}
          {sHandle}
        </div>
      );
    } else {
      // lol
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
              <TextInput
                label="x"
                id="selection-x"
                value={origin.x}
                onSubmit={val => {
                  this.onChangeCoord(val, 'x');
                }}
              />
            </div>
            <div className="sel-util__coords__y-input">
              <TextInput
                label="y"
                id="selection-y"
                value={origin.y}
                onSubmit={val => {
                  this.onChangeCoord(val, 'y');
                }}
              />
            </div>
          </div>
        );
      }
    }

    return <div className="sel-util__coords"> </div>;
  },

  renderHeight() {
    let { state, doc } = this.props.editor;
    if (!doc) return;

    let value, onSubmit;

    if (state.selection.length === 0) {
      value = doc.height;

      onSubmit = val => {
        if (val > 0) {
          this.props.editor.setDocDimens(doc.width, val);
        }
      };
    } else if (state.selectionBounds) {
      let bounds = state.selectionBounds.bounds;

      if (bounds) {
        onSubmit = val => {
          this.onChangeScale(val, 'h');
        };
        value = bounds.height;
      }
    }

    if (value === 0) {
      return null;
    }

    return (
      <div className="sel-util__height">
        <div className="sel-util__height__input">
          <TextInput id="selection-h" value={value} onSubmit={onSubmit} />
        </div>
      </div>
    );
  },

  renderWidth() {
    let { state, doc } = this.props.editor;
    if (!doc) return;

    let value, onSubmit;

    if (state.selection.length === 0) {
      value = doc.width;

      onSubmit = val => {
        if (val > 0) {
          this.props.editor.setDocDimens(val, doc.height);
        }
      };
    } else if (state.selectionBounds) {
      let bounds = state.selectionBounds.bounds;

      if (bounds) {
        onSubmit = val => {
          this.onChangeScale(val, 'w');
        };
        value = bounds.width;
      }
    }

    if (value === 0) {
      return null;
    }

    return (
      <div className="sel-util__width">
        <div className="sel-util__width__input">
          <TextInput id="selection-w" value={value} onSubmit={onSubmit} />
        </div>
      </div>
    );
  },

  render() {
    return (
      <Util title="Transform">
        <div className="sel-util">
          <div className="sel-util__main">
            <div className="sel-util__top">
              {this.renderCoords()}
              {this.renderThumb()}
              {this.renderHeight()}
            </div>
            <div className="sel-util__middle">
              {this.renderWidth()}
            </div>
          </div>
          <div className="sel-util__bottom">
            {this.renderSubheader()}
          </div>
        </div>
      </Util>
    );
  }
});

export default TransformUtil;
