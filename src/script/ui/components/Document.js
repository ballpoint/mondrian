import 'utils/document.scss';
import classnames from 'classnames';
import Util from 'ui/components/Util';

let DocumentUtil = React.createClass({


  renderPath() {

  },

  renderGroup() {

  },

  renderChild(child) {
    let children;
    let isSelected = this.props.editor.isSelected(child);

    if (child.children) {
      children = <div className={classnames({
        "doc-util__item__children": true,
      })}>
        {child.children.map(this.renderChild)}
      </div>
    }

    return (
      <div className={classnames({
        "doc-util__item": true,
        "selected": isSelected,
      })}>
        <div
          className={classnames({
            "doc-util__item__bar": true,
          })}
          onClick={() => {
            this.props.editor.setSelection([child]);
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
          {child.constructor.name}
        </div>
        {children}
      </div>
    );
  },

  render() {
    return (
      <Util title="Document">
        {
          this.props.editor.doc.layers.map(this.renderChild)
        }
      </Util>
    );
  }
});

export default DocumentUtil;
