export default class HistoryFrame {

  constructor(actions = []) {
    this.actions = actions;

    this.succ = [];
    this.timestamp = new Date();
    this.setSealTime(this.timestamp);

    this.sealed = false;
    this.merges = 0;
  }

  setSealTime(d) {
    this.sealTime = new Date(d.valueOf() + 500);
  }

  setPrev(prev) {
    this.prev = prev;

    if (prev) {
      prev.registerSucc(this);
    }
  }

  hasPrev() {
    return !!this.prev;
  }

  registerSucc(succ) {
    this.succ.push(succ);
    this.newestSucc = succ;
  }

  merge(action) {
    let a = this.actions[0];
    a.merge(action);

    this.setSealTime(action.created);
    this.merges++;
  }

  isSealed() {
    return this.sealed || (new Date() > this.sealTime);
  }

  canMerge(action) {
    if (this.isSealed()) return false;

    if (this.actions.length !== 1) return false;

    let a = this.actions[0];

    return (
      (a.constructor !== action.constructor) &&
      (!a.constructor.prototype.merge)
    );
  }

  seal() {
    this.sealed = true;
  }

  perform(editor) {
    for (let i = 0; i < this.actions.length; i++) {
      let a = this.actions[i];
      a.perform(editor);
    }
  }

  undo(editor) {
    for (let i = this.actions.length - 1; i >= 0; i--) {
      let a = this.actions[i].opposite();
      a.perform(editor);
    }
  }
}
