import React from 'react';

let HistoryUtil = React.createClass({
  render() {
    return (
      <div className="util-window">
        <div>
          {JSON.stringify(this.props.history.head.created)}
        </div>
      </div>
    );
  }
});

export default HistoryUtil;


