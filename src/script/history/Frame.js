export default class HistoryFrame {
  constructor(actions = [], title = '') {
    this.actions = actions;
    this.title = title;

    this.succ = [];
    this.timestamp = new Date();

    this.sealed = false;
    this.merges = 0;
  }

  get displayTitle() {
    if (this.title) {
      return this.title;
    } else {
      return this.actions
        .map(a => {
          return a.displayTitle || a.constructor.name;
        })
        .join('; ');
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
        this.merges++;
      }
    }
  }

  push(action) {
    this.actions.push(action);
  }

  isSealed() {
    return this.sealed;
  }

  get last() {
    return this.actions[this.actions.length - 1];
  }

  canMerge(action) {
    let sameType = this.last.constructor === action.constructor;
    if (!sameType) return false;

    let hasMerge = this.last.constructor.prototype.merge;
    if (!hasMerge) return false;

    let hasCanMerge = !!this.last.constructor.prototype.canMerge;

    if (hasCanMerge) {
      return this.last.canMerge(action);
    } else {
      return true;
    }
  }

  seal() {
    this.sealed = true;
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
