import 'utils/document.scss';
import classnames from 'classnames';
import Util from 'ui/components/utils/Util';
import Layer from 'io/layer';
import Thumb from 'ui/thumb';
import CanvasLayer from 'ui/layer';

let DocumentUtilChild = React.createClass({
  getInitialState() {
    return {
      nonce: 0,
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
    if (this.state.nonce < nonce) {
      let canvas = ReactDOM.findDOMNode(this.refs.thumbnail);
      if (canvas) {
        let thumb = new Thumb([this.props.child], { maxWidth: 20, maxHeight: 20 });
        thumb.drawTo(new CanvasLayer('thumb', canvas));
        //console.log('thumb', this.state.nonce, nonce, this.props.child);
        this.setState({ nonce });
      }
    }
  },

  render() {
    let child = this.props.child;
    let children;
    let isSelected = this.props.editor.isSelected(child);

    if (child.children && child.children.length > 0 && this.props.isExpanded(this.props.child)) {
      children = <div className={classnames({
        "doc-util__item__children": true,
      })}>
        {
          child.children.slice(0).reverse().map((child) => {
            return <DocumentUtilChild
              key={child.index.toString()}
              child={child}
              editor={this.props.editor}
              isExpanded={this.props.isExpanded}
              expand={this.props.expand}
              collapse={this.props.collapse}
            />
          })
        }
      </div>
    }

    return (
      <div className={classnames({
        "doc-util__item": true,
        "doc-util__item--parent": (child.children && child.children.length > 0),
        ["doc-util__item--"+child.constructor.name]: true,
        "selected": isSelected,
      })}>
        <div
          className={classnames({
            "doc-util__item__bar": true,
          })}
          onClick={() => {
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
          onMouseMove={(e) => {
            e.stopPropagation();
            this.props.editor.setHovering([child]);
          }}
          onMouseOut={(e) => {
            e.stopPropagation();
            this.props.editor.setHovering([]);
          }}
        >
          <div className="doc-util__item__bar__thumb"><canvas ref="thumbnail" /></div>
          <div className="doc-util__item__bar__type">{ child.constructor.name }</div>
          <div className="doc-util__item__bar__id">{ child.id }</div>
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
    }
  },

  componentDidMount() {
  },

  shouldComponentUpdate(nextProps, nextState) {
    // TODO optimize this shit
    return true;
  },

  componentWillReceiveProps(prevState) {
  },

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
        {
          this.props.editor.doc.layers.slice(0).reverse().map((child) => {
            return <DocumentUtilChild
              key={child.index.toString()}
              child={child}
              editor={this.props.editor}
              isExpanded={this.isExpanded}
              expand={this.expand}
              collapse={this.collapse}
            />
          })
        }
      </Util>
    );
  }
});

export default DocumentUtil;
