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
    let content;

    if (state.selection.length > 0) {

      switch (state.selectionType) {
        case 'ELEMENTS':
          if (state.selectionBounds) {
            let bounds = state.selectionBounds.bounds;
            content = <div>
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
          }
          break;
        case 'POINTS':
          if (state.selection.length === 1) {
            let pt = state.selection[0];
            content = <div>
              <div>x = {pt.x}</div>
              <div>y = {pt.y}</div>
              {
                pt.pHandle ? (
                  <div>
                    <div>p x = {pt.pHandle.x}</div>
                    <div>p y = {pt.pHandle.y}</div>
                  </div>
                ) : null
              }

              {
                pt.sHandle ? (
                  <div>
                    <div>s x = {pt.sHandle.x}</div>
                    <div>s y = {pt.sHandle.y}</div>
                  </div>
                ) : null
              }

            </div>
          } else {

          }
          break;
        default:
          content = <div>
          </div>
      }
    } else {
      content = <div>No selection</div>;
    }

    return <div className="sel-util">{content}</div>;
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
