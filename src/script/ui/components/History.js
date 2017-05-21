import React from 'react';

let HistoryUtil = React.createClass({
  render() {
    return (
      <div className="util-window">
        <div>
          {this.props.history.head.created.toString()}
        </div>
      </div>
    );
  }
});

export default HistoryUtil;


