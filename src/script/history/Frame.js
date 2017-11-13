export default class HistoryFrame {
  constructor(actions = []) {
    this.actions = actions;
    this.timestamp = new Date();
    this.committed = false;
  }

  static fromObject(attrs) {
    let frame = new HistoryFrame(attrs.actions || []);
    if (attrs.timestamp) frame.timestamp = attrs.timestamp;
    if (attrs.committed) frame.committed = true;
    if (attrs.id) frame.id = attrs.id;
    return frame;
  }

  // TODO remove
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
