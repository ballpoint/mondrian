class HistoryAction {
  constructor(data) {
    this.data = data;
    this.created = new Date();
  }
}

export class InitAction extends HistoryAction {
  perform(editor) {}
}

export class NudgeAction extends HistoryAction {
  perform(editor) {
    editor.selectFromQueries(this.data.items);
    for (let item of editor.state.selection) {
      item.nudge(this.data.xd, this.data.yd);
      item.clearCachedObjects();
    }
  }

  merge(event) {
    this.data.xd += event.data.xd;
    this.data.yd += event.data.yd;
  }

  opposite() {
    return new NudgeAction({
      items: this.data.items,
      xd:   -this.data.xd,
      yd:   -this.data.yd
    });
  }
}

export class ScaleAction extends HistoryAction {
  perform(editor) {
    editor.selectFromQueries(this.data.items);
    for (let item of editor.state.selection) {
      item.scale(this.data.x, this.data.y, this.data.origin);
    }
  }

  opposite() {
    return new ScaleAction({
      origin: this.data.origin,
      items: this.data.items,
      x: 1/this.data.x,
      y: 1/this.data.y,
    });
  }

  merge(event) {
    this.data.x *= event.data.x;
    this.data.y *= event.data.y;
  }
}

export class InsertAction extends HistoryAction {
  perform(editor) {
    for (let params of this.data) {
      editor.doc.insertElement(params.element, params.index);
    }
  }

  opposite() {
    return new DeleteAction({
      elements: this.data.map((d) => { return d.element })
    });
  }
}

export class DeleteAction extends HistoryAction {
  perform(editor) {
    for (let elem of this.data.elements) {
      editor.doc.removeId(elem.id);
    }
  }

  opposite() {
    let params = [];
    for (let element of this.data.elements) {
      let index = this.data.indexes[element.id];
      params.push({ element, index });
    }
    return new InsertAction(params);
  }

  merge(event) {
    this.data.indexes = _.merge(this.data.indexes, event.data.indexes);
    this.data.elements = this.data.elements.concat(event.data.elements);
  }
}

