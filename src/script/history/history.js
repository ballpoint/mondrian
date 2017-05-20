import _ from 'lodash';
import { InitEvent } from 'history/events';

const EVENT_MERGE_THRESHOLD = 500; // ms

export default class DocHistory {
  // Linked list history data struct ,'>)
  constructor() {
    this.head = new InitEvent();
    this.tail = null;
  }

  push(event, opts={}) {
    if (
      this.head.constructor === event.constructor &&
      (event.created.valueOf() - this.head.created.valueOf()) < EVENT_MERGE_THRESHOLD
    ) {
      // Merge events
      this.head.merge(event);
      return;
    }

    event.setPrev(this.head);
    this.setHead(event);
  }

  setHead(event) {
    this.head = event;
  }

  undo(editor) {
    this.head.undo(editor);
    if (this.head.prev) {
      this.setHead(this.head.prev);
    }
  }

  redo(editor) {
    let next = this.head.newestSucc;
    if (next) {
      next.perform(editor);
      this.setHead(next);
    }
  }
}
