import 'utils/document.scss';
import classnames from 'classnames';
import Util from 'ui/components/Util';
import Layer from 'io/layer';

let DocumentUtilChild = React.createClass({
  getInitialState() {
    return {
      expanded: false
    }
  },

  render() {
    let child = this.props.child;
    let children;
    let isSelected = this.props.editor.isSelected(child);

    if (this.state.expanded && child.children && child.children.length > 0) {
      children = <div className={classnames({
        "doc-util__item__children": true,
      })}>
        {
          child.children.map((child) => {
            return <DocumentUtilChild
              key={child.index.toString()}
              child={child}
              editor={this.props.editor}
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
          {child.constructor.name} {child.id}
        </div>
        {children}
      </div>
    );
  }
});

let DocumentUtil = React.createClass({
  render() {
    return (
      <Util title="Document">
        {
          this.props.editor.doc.layers.slice(0).reverse().map((child) => {
            return <DocumentUtilChild
              child={child}
              editor={this.props.editor}
            />
          })
        }
      </Util>
    );
  }
});

export default DocumentUtil;
