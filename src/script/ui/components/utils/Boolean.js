import Path from 'geometry/path';
import Util from 'ui/components/utils/Util';
import bool from 'lib/bool';
import Color from 'ui/color';

let BooleanUtil = React.createClass({
  do(op) {
    let result = bool[op](this.props.editor.state.selection.slice(0));

    this.props.editor.deleteSelection();
    this.props.editor.insertElements([result]);
  },
  render() {
    return (
      <Util title="Boolean">
        <div>
          <div><a href="#" onClick={() => {this.do('unite')}}>Unite</a></div>
          <div><a href="#" onClick={() => {this.do('subtract')}}>Subtract</a></div>
          <div><a href="#" onClick={() => {this.do('intersect')}}>Intersect</a></div>
        </div>
      </Util>
    );
  }
});

export default BooleanUtil;



