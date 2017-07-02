import 'utils/selection.scss';
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
      if (state.selectionBounds) {
        let bounds = state.selectionBounds.bounds;
        return <div className="sel-util">
          <div>
            x = {bounds.x.toFixed(2)}
          </div>
          <div>
            y = {bounds.y.toFixed(2)}
          </div>
          <div>
            w = {bounds.width.toFixed(2)}
          </div>
          <div>
            h = {bounds.height.toFixed(2)}
          </div>
          <div>
            indexes = {state.selection.map((elem) => { return elem.index.toString() }).join(' ')}
          </div>
        </div>
      } else {
        return 'wedep';
      }
    } else if (doc) {
      return <div className="sel-util">
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
