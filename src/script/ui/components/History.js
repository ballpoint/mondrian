import Util from 'ui/components/Util';

let HistoryUtil = React.createClass({
  keyVal(e) {
    let out = '';
    for (let key in e) {
      if (key === 'prev' || key === 'succ') {
        continue;
      }
      let val = e[key];

      let s;

      if (key === 'actions') {
        try {
          s = JSON.stringify(val.map((v) => { return v.data }));
        } catch(e) {
          s = '{...}';
        }
      } else {
        s = val.toString();
      }

      if (val !== undefined) {
        out += (key + '=' + s + '\n');
      }
    }
    return out;
  },

  render() {
    return (
      <Util title="History">
        <div>{this.props.history.head.actions.map((a) => { return a.constructor.name}) }</div>
        <pre>
          {this.keyVal(this.props.history.head)}
        </pre>
      </Util>
    );
  }
});

export default HistoryUtil;


