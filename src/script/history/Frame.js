export default class HistoryFrame {
  constructor(actions = [], title = '') {
    this.actions = actions;
    this.title = title;

    this.timestamp = new Date();

    this.committed = false;
  }

  get displayTitle() {
    return this.title || 'Frame';
  }

  get empty() {
    return this.actions.length === 0;
  }

  push(action) {
    this.actions.push(action);
  }

  get last() {
    return this.actions[this.actions.length - 1];
  }

  commit() {
    this.committed = true;
  }

  perform(doc) {
    for (let i = 0; i < this.actions.length; i++) {
      let a = this.actions[i];
      a.perform(doc);
    }
  }

  undo(doc) {
    for (let i = this.actions.length - 1; i >= 0; i--) {
      let a = this.actions[i].opposite();
      a.perform(doc);
    }
  }
}
