import _ from 'lodash';
import { InitEvent } from 'history/events';

export default class DocHistory {
  // Linked list history data struct ,'>)
  constructor() {
    this.head = new InitEvent();
    this.tail = null;

    this.deferSeal = _.debounce(this.seal.bind(this), 500);
  }

  push(event, opts={}) {
    if (
      !this.head.sealed &&
      this.head.constructor === event.constructor
    ) {
      // Merge events
      this.head.merge(event);
      this.deferSeal();
      return;
    }

    event.setPrev(this.head);
    this.setHead(event);
  }

  seal() {
    this.head.sealed = true;
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
