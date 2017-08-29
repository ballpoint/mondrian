import HistoryFrame from 'history/Frame';
import * as actions from 'history/actions/actions';
import EventEmitter from 'lib/events';

export default class DocHistory extends EventEmitter {
  constructor() {
    super();
    let initFrame = new HistoryFrame([
      new actions.InitAction() // TODO shove doc in here
    ]);
    this.stageFrame(initFrame);
    this.commitFrame();
  }

  stageFrame(frame, doc) {
    if (frame.empty) return;

    if (this.head && !this.head.committed) {
      // Undo staged but uncommitted frame
      this.undo(doc);
    }

    if (this.head) {
      frame.depth = this.head.depth + 1;
    } else {
      frame.depth = 0;
    }

    for (let action of frame.actions) {
      action.perform(doc);
    }

    frame.setPrev(this.head);
    this.setHead(frame);
  }

  commitFrame() {
    this.head.commit();

    if (this.head.prev) {
      this.head.prev.registerSucc(this.head);
    }

    this.trigger('commit');
  }

  pushAction(action, doc) {
    action.perform(doc);

    if (!this.head.committed) {
      this.head.actions.push(action);
    } else {
      let nf = new HistoryFrame([action]);
      // TODO maybe pushing an action when no unstaged head is an error
      this.stageFrame(nf);
    }
  }

  setHead(action) {
    this.head = action;
  }

  canUndo() {
    return this.head.hasPrev();
  }

  undo(doc) {
    if (this.head.hasPrev()) {
      this.head.undo(doc);
      if (this.head.prev) {
        this.setHead(this.head.prev);
      }
    }
  }

  canRedo() {
    return !!this.head.newestSucc;
  }

  redo(doc) {
    let next = this.head.newestSucc;
    if (next) {
      next.perform(doc);
      this.setHead(next);
    }
  }

  jumpToDepth(doc, d) {
    let delta = this.head.depth - d;
    if (delta === 0) {
      return;
    } else if (delta < 0) {
      for (let i = 0; i < Math.abs(delta); i++) {
        this.redo(doc);
      }
    } else if (delta > 0) {
      for (let i = 0; i < delta; i++) {
        this.undo(doc);
      }
    }
  }
}
