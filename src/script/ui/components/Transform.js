import React from 'react';

let TransformUtil = React.createClass({
  label() {
    let sel = this.props.editor.state.selection
    if (sel.length === 0) {
      return 'Document'
    } else  if (sel.length === 1) {
      return sel[0].constructor.name +' '+sel[0]._i
    } else if (sel.length > 1) {
      return sel.length + ' items'
    }
  },

  metadata() {
    let { state, doc } = this.props.editor;
    if (state.selection.length > 0) {
      return <div>
        <div>
          x = {state.selectionBounds.x}
        </div>
        <div>
          y = {state.selectionBounds.y}
        </div>
        <div>
          w = {state.selectionBounds.width}
        </div>
        <div>
          h = {state.selectionBounds.height}
        </div>
      </div>
    } else if (doc) {
      return <div>
        {doc.elements.length} elements
      </div>
    }
  },

  render() {
    return (
      <div className="util-window">
        <div>
          {this.label()}
          {this.metadata()}
        </div>
      </div>
    );
  }
});

export default TransformUtil;
