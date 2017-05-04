class HistoryEvent {
  constructor(data) {
    this.data = data;
    this.succ = [];
  }

  setPrev(prev) {
    this.prev = prev;

    if (prev) {
      prev.registerSucc(this);
    }
  }

  registerSucc(succ) {
    this.succ.push(succ);
    this.newestSucc = succ;
  }
}

export class InitEvent extends HistoryEvent {
  constructor(data) {
    super(data);

    this.sealed = false;
  }

  perform(editor) {
  }

  undo(editor) {
  }
}

export class NudgeEvent extends HistoryEvent {
  constructor(data) {
    super(data);
  }

  perform(editor) {
    let elems = editor.doc.getElements(this.data.ids);
    for (let elem of elems) {
      elem.nudge(this.data.xd, this.data.yd);
    }
  }

  undo(editor) {
    let elems = editor.doc.getElements(this.data.ids);
    for (let elem of elems) {
      elem.nudge(-this.data.xd, -this.data.yd);
    }
  }

  merge(event) {
    this.data.xd += event.data.xd;
    this.data.yd += event.data.yd;
  }
}

export class ScaleEvent extends HistoryEvent {
  constructor(data) {
    super(data);
  }

  perform(editor) {
    let elems = editor.doc.getElements(this.data.ids);
    for (let elem of elems) {
      elem.scale(this.data.x, this.data.y, this.data.origin);
    }
  }

  undo(editor) {
    let elems = editor.doc.getElements(this.data.ids);
    for (let elem of elems) {
      elem.scale(1/this.data.x, 1/this.data.y, this.data.origin);
    }
  }

  merge(event) {
    this.data.x *= event.data.x;
    this.data.y *= event.data.y;
  }
}
