export default class HistoryFrame {

  constructor(actions = []) {
    this.actions = actions;

    this.succ = [];
    this.timestamp = new Date();

    this.sealed = false;
    this.merges = 0;

    this.setSealTime(this.timestamp);
  }

  setSealTime(current) {
    if (this.actions.length === 1) {
      let action = this.actions[0];
      if (action.constructor.expiration) {
        this.sealTime = new Date(
          action.created.valueOf() + action.constructor.expiration
        );
      }
    } else {
      delete this.sealTime;
    }
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
    if (!this.sealTime) return false;

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
