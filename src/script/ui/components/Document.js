import 'utils/document.scss';
import classnames from 'classnames';
import Util from 'ui/components/Util';
import Layer from 'io/layer';

let DocumentUtilChild = React.createClass({
  getInitialState() {
    return {
      expanded: false,
    }
  },

  render() {
    let child = this.props.child;
    let children;
    let isSelected = this.props.editor.isSelected(child);

    if (child.children && child.children.length > 0) {
      children = <div className={classnames({
        "doc-util__item__children": true,
        "doc-util__item__children--hidden": !this.state.expanded,
      })}>
        {
          child.children.slice(0).reverse().map((child) => {
            return <DocumentUtilChild
              key={child.index.toString()}
              child={child}
              editor={this.props.editor}
              getThumbnail={this.props.getThumbnail}
            />
          })
        }
      </div>
    }

    let thumbnail = this.props.getThumbnail(this.props.child);

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
            this.setState({ expanded: !this.state.expanded });
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
          { thumbnail ? <div className="doc-util__item__bar__thumb"><img src={thumbnail.url} /></div> : null }
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
      cachedThumbnails: {}
    }
  },

  getThumbnail(child) {
    let cached = this.state.cachedThumbnails[child.__id__];
    if (cached) {
      return cached;
    }

    // Generate thumbnail
    let thumb = child.thumbnail;

    this.state.cachedThumbnails[child.__id__] = thumb;
    return thumb;
  },

  componentDidMount() {
    this._clearCachedThumbnails = _.debounce(() => {
      this.setState({ cachedThumbnails: {} });
    }, 250);
  },

  componentWillReceiveProps(prevState) {
    this._clearCachedThumbnails();
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
              getThumbnail={this.getThumbnail}
            />
          })
        }
      </Util>
    );
  }
});

export default DocumentUtil;
