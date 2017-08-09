import HistoryFrame from "history/Frame";
import * as actions from "history/actions/actions";

export default class DocHistory {
  // Linked list history data struct ,'>)
  constructor() {
    let initFrame = new HistoryFrame([
      new actions.InitAction() // TODO shove doc in here
    ]);
    initFrame.seal();
    this.pushFrame(initFrame);
  }

  pushFrame(frame) {
    if (this.head) {
      frame.depth = this.head.depth + 1;
    } else {
      frame.depth = 0;
    }

    frame.setPrev(this.head);
    this.setHead(frame);
  }

  pushAction(action) {
    if (!this.head.isSealed()) {
      if (this.head.canMerge(action)) {
        this.head.merge(action);
      } else {
        this.head.actions.push(action);
      }
    } else {
      let nf = new HistoryFrame([action]);
      this.pushFrame(nf);
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
