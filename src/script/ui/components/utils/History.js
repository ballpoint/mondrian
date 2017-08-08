import 'utils/history.scss';
import classnames from 'classnames';
import Util from 'ui/components/utils/Util';

let HistoryUtil = React.createClass({
  renderHistoryFrame(frame, selected=false) {
    return (
      <div key={"frame"+frame.depth} className={classnames({
        "history-util__frame": true,
        "selected": selected,
      })} onClick={() => {
        this.props.editor.jumpToHistoryDepth(frame.depth);
      }}>
        <div className="history-util__frame__depth">{ frame.depth }</div> 
        <div className="history-util__frame__title">{ frame.displayTitle }</div>
      </div>
    );
  },

  render() {
    if (!this.props.doc || !this.props.doc.history) {
      return null;
    }

    let history = this.props.doc.history;

    let frames = [];

    let cursor = history.head;
    let currentDepth = cursor.depth;

    for (let i = 0; i < 5; i++) {
      // Move up to 5 frames up
      if (cursor.newestSucc) {
        cursor = cursor.newestSucc;
      } else {
        break; // At the newest
      }
    }

    for (let i = 0; i < 10; i++) {
      frames.push(
        this.renderHistoryFrame(cursor, cursor.depth === currentDepth)
      );

      if (cursor.prev) {
        cursor = cursor.prev;
      } else {
        break;
      }
    }

    return (
      <Util title="History">
        {frames}
      </Util>
    );
  }
});

export default HistoryUtil;


