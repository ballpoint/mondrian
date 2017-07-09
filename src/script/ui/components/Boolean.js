import Path from 'geometry/path';
import Util from 'ui/components/Util';
import bool from 'lib/bool';
import Color from 'ui/color';

let BooleanUtil = React.createClass({
  do(op) {
    let pls = this.props.editor.state.selection.slice(0).map((elem) => {
      return elem.points;
    });

    let resultPoints = bool[op](pls);

    let result = new Path({
      d: resultPoints,
      stroke: new Color('000000'),
      fill: new Color('CCCCCC')
    });

    this.props.editor.deleteSelection();
    this.props.editor.insertElements([result]);
  },
  render() {
    return (
      <Util title="Transform">
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



