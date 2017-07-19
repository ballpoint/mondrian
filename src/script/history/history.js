import HistoryFrame from 'history/Frame';

const FRAME_MERGE_THRESHOLD = 500; // ms

export default class DocHistory {
  // Linked list history data struct ,'>)
  constructor() {
    this.head = new HistoryFrame();
    this.head.seal();
  }

  pushFrame(frame) {
    frame.setPrev(this.head);
    this.setHead(frame);
  }

  pushAction(action) {
    if (!this.head.isSealed()){ 
      if (this.head.canMerge(action)) {
        this.head.merge(action);
      } else {
        this.head.actions.push(action);
      }
    } else {
      let nf = new HistoryFrame([action]);
      nf.setPrev(this.head);
      this.setHead(nf);
    }

    /*
    if (
      this.head.constructor === action.constructor &&
      (action.created.valueOf() - this.head.created.valueOf()) < FRAME_MERGE_THRESHOLD
    ) {
      // Merge events
      this.head.merge(action);
      return;
    }
    */
  }

  setHead(action) {
    this.head = action;
  }

  canUndo() {
    return this.head.hasPrev();
  }

  undo(editor) {
    if (this.head.hasPrev()) {
      this.head.undo(editor);
      if (this.head.prev) {
        this.setHead(this.head.prev);
      }
    }
  }

  canRedo() {
    return !!this.head.newestSucc;
  }

  redo(editor) {
    let next = this.head.newestSucc;
    if (next) {
      next.perform(editor);
      this.setHead(next);
    }
  }
}
