import React from 'react';

let HistoryUtil = React.createClass({
  keyVal(e) {
    let out = '';
    for (let key in e) {
      if (key === 'prev' || key === 'succ') {
        continue;
      }
      let val = e[key];

      let s;

      if (key === 'data') {
        s = JSON.stringify(val);
      } else {
        s = val.toString();
      }

      if (val) {
        out += (key + '=' + s + '\n');
      }
    }
    return out;
  },

  render() {
    return (
      <div className="util-window">
        <div>
          <pre>
            {this.keyVal(this.props.history.head)}
          </pre>
        </div>
      </div>
    );
  }
});

export default HistoryUtil;


