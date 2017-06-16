import Util from 'ui/components/Util';

let SelectionUtil = React.createClass({
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
    if (state.selectionType === 'ELEMENTS' && state.selection.length > 0) {
      return <div>
        <div>
          x = {state.selectionBounds.x.toFixed(2)}
        </div>
        <div>
          y = {state.selectionBounds.y.toFixed(2)}
        </div>
        <div>
          w = {state.selectionBounds.width.toFixed(2)}
        </div>
        <div>
          h = {state.selectionBounds.height.toFixed(2)}
        </div>
        { state.selection.length === 1 ? (
          <div>
            points = {state.selection[0].points.all().length}
          </div>
        ) : null }
        <div>
          fills = {state.selection.map((e) => { return e.data.fill }).join(', ')}
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
      <Util title="Selection">
        {this.label()}
        {this.metadata()}
      </Util>
    );
  }
});

export default SelectionUtil;
