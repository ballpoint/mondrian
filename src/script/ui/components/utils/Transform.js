import Bounds from 'geometry/bounds';
import Thumb from 'ui/thumb';
import Layer from 'ui/layer';
import Util from 'ui/components/utils/Util';
import Projection from 'ui/projection';
import TextInput from 'ui/components/utils/TextInput';
import { ELEMENTS, POINTS, PHANDLE, SHANDLE } from 'ui/selection';
import units from 'lib/units';
import math from 'lib/math';

import 'utils/transform.scss';

const THUMB_IMG_MAX_WIDTH = 120;
const THUMB_IMG_MAX_HEIGHT = 80;

class TransformUtil extends React.Component {
  state = {
    originId: 'tl'
  };

  shouldComponentUpdate(nextProps, nextState) {
    if (!this.props.selection || nextProps.selection) {
      return true;
    } else {
      return !this.props.selection.bounds.equal(nextProps.selection.bounds);
    }
    return true;
  }

  formatValue(v) {
    let doc = this.props.editor.doc;

    if (doc.media === 'digital') {
      return math.fmtFloat(v);
    } else {
      return math.fmtFloat(units.fromPt(v, doc.printUnit));
    }
  }

  parseValue(v) {
    let doc = this.props.editor.doc;

    if (doc.media === 'digital') {
      return v;
    } else {
      return units.toPt(v, doc.printUnit);
    }
  }

  renderSubheader = () => {
    let sel = this.props.editor.state.selection;
    let items = sel.items;
    let subheader;
    if (items.length === 0) {
      subheader = 'Document';
    } else {
      let noun = {
        [ELEMENTS]: 'Element',
        [POINTS]: 'Point',
        [SHANDLE]: 'Control point',
        [PHANDLE]: 'Control point'
      }[sel.type];

      if (items.length > 1) {
        subheader = noun + 's';
      } else {
        subheader = noun;
      }
    }

    return <div className="sel-util__subheader">{subheader}</div>;
  };

  componentDidUpdate() {
    let canvas = ReactDOM.findDOMNode(this.refs.thumbnail);

    if (canvas) {
      let thumb = this.getThumbnail();
      thumb.drawTo(new Layer('thumb', canvas));
    }
  }

  componentWillReceiveProps(prevState) {
    // Handle changing the thumbnail. Debounce if selection ids haven't changed.
  }

  onChangeCoord = (val, which) => {
    let xd = 0,
      yd = 0;
    let { editor } = this.props;
    let doc = editor.doc;
    if (editor.state.selection) {
      let bounds = editor.state.selection.bounds;
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
  };

  onChangeScale = (val, which) => {
    let xs = 1,
      ys = 1;
    let { editor } = this.props;
    let doc = editor.doc;
    if (editor.state.selection) {
      let bounds = editor.state.selection.bounds;
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
  };

  getThumbnail = () => {
    return new Thumb(this.props.editor.state.selection.items, {
      maxWidth: THUMB_IMG_MAX_WIDTH,
      maxHeight: THUMB_IMG_MAX_HEIGHT
    });
  };

  renderOriginButton = id => {
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
  };

  renderThumb = () => {
    let { editor } = this.props;
    let doc = editor.doc;
    let bounds = editor.state.selection.bounds;

    let img;
    let brackets;

    if (!doc) return;

    if (editor.state.selection.empty) {
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
      if (editor.state.selection.type === ELEMENTS) {
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
      } else if (editor.state.selection.isOfType([POINTS, PHANDLE, SHANDLE])) {
        // If we have more than one point, we draw their thumbnail
        // Otherwise, we render point + handle circle controls

        if (editor.state.selection.items.length > 1) {
        } else {
          return (
            <div className="sel-util__thumb">
              {<div className="sel-util__thumb__point" />}

              {bounds.height > 0 ? (
                <div className="sel-util__thumb__height-bracket" />
              ) : null}
              {bounds.width > 0 ? (
                <div className="sel-util__thumb__width-bracket" />
              ) : null}
            </div>
          );
        }
      }
    }
  };

  getOrigin = bounds => {
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
  };

  renderCoords = () => {
    let { editor } = this.props;
    let doc = editor.doc;
    if (editor.state.selection) {
      let bounds = editor.state.selection.bounds;

      if (bounds) {
        let origin = this.getOrigin(bounds);
        return (
          <div className="sel-util__top__left">
            <div className="sel-util__top__left__x-input">
              <TextInput
                label="x"
                id="selection-x"
                value={this.formatValue(origin.x)}
                onSubmit={val => {
                  this.onChangeCoord(this.parseValue(val), 'x');
                }}
              />
            </div>
            <div className="sel-util__top__left__y-input">
              <TextInput
                label="y"
                id="selection-y"
                value={this.formatValue(origin.y)}
                onSubmit={val => {
                  this.onChangeCoord(this.parseValue(val), 'y');
                }}
              />
            </div>
          </div>
        );
      }
    }

    return <div className="sel-util__top__left"> </div>;
  };

  renderHeight = () => {
    let { editor } = this.props;
    let doc = editor.doc;
    if (!doc) return;

    let value, onSubmit;

    if (editor.state.selection.empty) {
      value = doc.height;

      onSubmit = val => {
        if (val > 0) {
          this.props.editor.setDocDimens(doc.width, this.parseValue(val));
        }
      };
    } else if (editor.state.selection) {
      let bounds = editor.state.selection.bounds;

      if (bounds) {
        onSubmit = val => {
          this.onChangeScale(this.parseValue(val), 'h');
        };
        value = bounds.height;
      }
    }

    if (value === 0) {
      return null;
    }

    return (
      <div className="sel-util__top__right">
        <div className="sel-util__top__right__input">
          <TextInput
            id="selection-h"
            value={this.formatValue(value)}
            onSubmit={onSubmit}
            unit={this.unitLabel()}
          />
        </div>
      </div>
    );
  };

  renderWidth() {
    let { editor } = this.props;
    let doc = editor.doc;
    if (!doc) return;

    let value, onSubmit;

    if (editor.state.selection.empty) {
      value = doc.width;

      onSubmit = val => {
        if (val > 0) {
          this.props.editor.setDocDimens(this.parseValue(val), doc.height);
        }
      };
    } else if (editor.state.selection) {
      let bounds = editor.state.selection.bounds;

      if (bounds) {
        onSubmit = val => {
          this.onChangeScale(this.parseValue(val), 'w');
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
          <TextInput
            id="selection-w"
            value={this.formatValue(value)}
            onSubmit={onSubmit}
            unit={this.unitLabel()}
          />
        </div>
      </div>
    );
  }

  unitLabel() {
    let l = 'px';
    let doc = this.props.editor.doc;
    if (doc.media === 'print') {
      l = doc.printUnit;
    }
    return l;
  }

  render() {
    return (
      <Util title="Transform" id="transform">
        <div className="sel-util">
          <div className="sel-util__main">
            <div className="sel-util__top">
              {this.renderCoords()}
              {this.renderThumb()}
              {this.renderHeight()}
            </div>
            <div className="sel-util__middle">{this.renderWidth()}</div>
          </div>
          <div className="sel-util__bottom">{this.renderSubheader()}</div>
        </div>
      </Util>
    );
  }
}

export default TransformUtil;
