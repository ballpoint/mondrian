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
    for (let a of this.actions) {
      if (a.constructor === action.constructor) {
        a.merge(action);
        this.setSealTime(action.created);
        this.merges++;
      }
    }
  }

  push(action) {
    this.actions.push(action);
  }

  isSealed() {
    return this.sealed || (new Date().valueOf() > this.sealTime.valueOf());
  }

  get last() {
    return this.actions[this.actions.length-1];
  }

  canMerge(action) {
    return (
      this.last.constructor === action.constructor &&
      this.last.constructor.prototype.merge
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
