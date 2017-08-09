import 'utils/document.scss';
import classnames from 'classnames';
import Util from 'ui/components/utils/Util';
import Layer from 'io/layer';
import Thumb from 'ui/thumb';
import CanvasLayer from 'ui/layer';
import HistoryFrame from 'history/Frame';
import * as actions from 'history/actions/actions';

let ChildCtrlButton = React.createClass({
  label() {
    switch (this.props.type) {
      case 'visibility':
        return this.props.value ? 'V' : 'v';
      case 'lock':
        return this.props.value ? 'L' : 'l';
      case 'delete':
        return 'D';
    }
  },

  onClick() {
    if (this.props.disabled) return;

    let frame;
    switch (this.props.type) {
      case 'visibility':
        frame = new HistoryFrame([
          new actions.ToggleMetadataBoolAction({
            indexes: [this.props.child.index],
            key: 'visible'
          })
        ]);
        break;
      case 'lock':
        frame = new HistoryFrame([
          new actions.ToggleMetadataBoolAction({
            indexes: [this.props.child.index],
            key: 'locked'
          })
        ]);
        break;
      case 'delete':
        break;
    }

    frame.seal();
    this.props.editor.perform(frame);
  },

  render() {
    return (
      <div
        className={classnames({
          'doc-util__item__bar__ctrls__ctrl': true,
          disabled: this.props.disabled
        })}
        onClick={this.onClick}
      >
        {this.label()}
      </div>
    );
  }
});

let DocumentUtilChild = React.createClass({
  getInitialState() {
    return {
      nonce: 0,
      id: ''
    };
  },

  componentWillReceiveProps(nextProps) {
    if (nextProps.child.__id__ !== this.state.id) {
      this.setState({
        id: nextProps.child.__id__,
        nonce: 0
      });
    }
  },

  componentDidMount() {
    this.updateThumbDebounced = _.debounce(this.updateThumb, 1000);
    this.updateThumb();
  },

  componentDidUpdate() {
    this.updateThumb();
  },

  updateThumb() {
    let nonce = this.props.child.__nonce__;
    let dimens = 20;
    if (this.props.child instanceof Layer) {
      dimens = 30;
    }

    if (this.state.nonce < nonce) {
      let canvas = ReactDOM.findDOMNode(this.refs.thumbnail);
      if (canvas) {
        let thumb = new Thumb([this.props.child], {
          maxWidth: dimens,
          maxHeight: dimens
        });
        thumb.drawTo(new CanvasLayer('thumb', canvas));
        this.setState({ nonce });
      }
    }
  },

  render() {
    let child = this.props.child;
    let children;

    let isSelected =
      this.props.parentSelected || this.props.editor.isSelected(child);
    let propagateSelected = !(child instanceof Layer);

    let isLocked = this.props.editor.doc.isLocked(child);
    let isVisible = this.props.editor.doc.isVisible(child);
    let isAvailable = !isLocked && isVisible;

    if (
      child.children &&
      child.children.length > 0 &&
      this.props.isExpanded(this.props.child)
    ) {
      children = (
        <div
          className={classnames({
            'doc-util__item__children': true
          })}
        >
          {child.children.slice(0).reverse().map(child => {
            return (
              <DocumentUtilChild
                key={child.index.toString()}
                child={child}
                editor={this.props.editor}
                isExpanded={this.props.isExpanded}
                expand={this.props.expand}
                collapse={this.props.collapse}
                parentSelected={propagateSelected && isSelected}
                parentLocked={isLocked}
                parentVisible={isVisible}
              />
            );
          })}
        </div>
      );
    }

    return (
      <div
        className={classnames({
          'doc-util__item': true,
          'doc-util__item--parent': child.children && child.children.length > 0,
          ['doc-util__item--' + child.constructor.name]: true,
          selected: isSelected
        })}
      >
        <div
          className={classnames({
            'doc-util__item__bar': true
          })}
        >
          <div
            className="doc-util__item__bar__label"
            onClick={e => {
              e.stopPropagation();
              if (!isAvailable) return;
              if (child instanceof Layer) {
                this.props.editor.setCurrentLayer(child);
              } else {
                this.props.editor.setSelection([child]);
              }
            }}
            onDoubleClick={() => {
              if (this.props.isExpanded(this.props.child)) {
                this.props.collapse(this.props.child);
              } else {
                this.props.expand(this.props.child);
              }
            }}
            onMouseMove={e => {
              e.stopPropagation();
              if (!isAvailable) return;
              this.props.editor.setHovering([child]);
            }}
            onMouseOut={e => {
              e.stopPropagation();
              if (!isAvailable) return;
              this.props.editor.setHovering([]);
            }}
          >
            <div className="doc-util__item__bar__thumb">
              <canvas ref="thumbnail" />
            </div>
            <div className="doc-util__item__bar__type">
              {child.constructor.name}
            </div>
            <div className="doc-util__item__bar__id">
              {child.id}
            </div>
          </div>
          <div className="doc-util__item__bar__ctrls">
            <ChildCtrlButton
              child={this.props.child}
              editor={this.props.editor}
              type="visibility"
              value={isVisible}
              disabled={!this.props.parentVisible}
            />
            <ChildCtrlButton
              child={this.props.child}
              editor={this.props.editor}
              type="lock"
              value={isLocked}
              disabled={this.props.parentLocked}
            />
            <ChildCtrlButton
              child={this.props.child}
              editor={this.props.editor}
              type="delete"
              value={true}
            />
          </div>
        </div>
        {children}
      </div>
    );
  }
});

let DocumentUtil = React.createClass({
  getInitialState() {
    return {
      expandedIndexes: {}
    };
  },

  componentDidMount() {},

  shouldComponentUpdate(nextProps, nextState) {
    // TODO optimize this shit
    return true;
  },

  componentWillReceiveProps(prevState) {},

  expand(child) {
    this.state.expandedIndexes[child.index.toString()] = true;
    this.setState({ expandedIndexes: this.state.expandedIndexes });
  },

  collapse(child) {
    delete this.state.expandedIndexes[child.index.toString()];
    this.setState({ expandedIndexes: this.state.expandedIndexes });
  },

  isExpanded(child) {
    return !!this.state.expandedIndexes[child.index.toString()];
  },

  render() {
    return (
      <Util title="Document">
        <div className="doc-util__items">
          {this.props.editor.doc.layers.slice(0).reverse().map(child => {
            return (
              <DocumentUtilChild
                key={child.index.toString()}
                child={child}
                editor={this.props.editor}
                isExpanded={this.isExpanded}
                expand={this.expand}
                collapse={this.collapse}
                parentVisible={true}
                parentLocked={false}
              />
            );
          })}
        </div>
        <div className="doc-util__ctrls">+</div>
      </Util>
    );
  }
});

export default DocumentUtil;
