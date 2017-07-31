import Path from 'geometry/path';
import PathPoint from 'geometry/path-point';
import Item from 'geometry/item';

export class HistoryAction {
  constructor(data) {
    this.data = data;
    this.created = new Date();
  }
}

export class InitAction extends HistoryAction {
  perform(editor) {}
}

export class NudgeAction extends HistoryAction {
  static get expiration() { return 500 }

  perform(editor) {
    for (let index of this.data.indexes) {
      let item = editor.doc.getFromIndex(index);
      item.nudge(this.data.xd, this.data.yd);
      
      if (item instanceof Path) {
        item.clearCachedObjects();
      } else if (item instanceof PathPoint && item.path) {
        item.path.clearCachedObjects();
      }
    }

    editor.canvas.refreshAll();
    editor.calculateSelectionBounds();
    editor.trigger('change');
  }

  merge(action) {
    this.data.xd += action.data.xd;
    this.data.yd += action.data.yd;
  }

  opposite() {
    return new NudgeAction({
      indexes: this.data.indexes,
      xd:   -this.data.xd,
      yd:   -this.data.yd
    });
  }
}

export class ScaleAction extends HistoryAction {
  static get expiration() { return 500 }

  perform(editor) {
    for (let index of this.data.indexes) {
      let item = editor.doc.getFromIndex(index);
      if (item) {
        item.scale(this.data.x, this.data.y, this.data.origin);
      } // TODO handle else case?
    }

    editor.canvas.refreshAll();
    editor.calculateSelectionBounds();
    editor.trigger('change');
  }

  opposite() {
    return new ScaleAction({
      origin: this.data.origin,
      indexes: this.data.indexes,
      x: 1/this.data.x,
      y: 1/this.data.y,
    });
  }

  merge(action) {
    this.data.x *= action.data.x;
    this.data.y *= action.data.y;
  }
}

export class RotateAction extends HistoryAction {
  static get expiration() { return 500 }

  perform(editor) {
    for (let index of this.data.indexes) {
      let item = editor.doc.getFromIndex(index);
      item.rotate(this.data.a, this.data.origin);
    }

    editor.canvas.refreshAll();
    editor.calculateSelectionBounds();
    editor.trigger('change');
  }

  merge(action) {
    this.data.a += action.data.a;
    if (this.data.a < 0) {
      this.data.a += 360;
    }
    this.data.a %= 360;
  }

  opposite() {
    return new RotateAction({
      indexes: this.data.indexes,
      a: -this.data.a,
      origin: this.data.origin
    });
  }
}

export class NudgeHandleAction extends HistoryAction {
  perform(editor) {
    let points = this.data.indexes.map((q) => { return editor.doc.getFromIndex(q) });
    editor.setSelection(points);
    for (let point of points) {
      point.nudgeHandle(this.data.handle, this.data.xd, this.data.yd);

      if (point.path) {
        point.path.clearCachedObjects();
      }
    }

    editor.canvas.refreshAll();
    editor.calculateSelectionBounds();
    editor.trigger('change');
  }

  merge(action) {
    this.data.xd += action.data.xd;
    this.data.yd += action.data.yd;
  }

  opposite() {
    return new NudgeHandleAction({
      indexes: this.data.indexes,
      handle: this.data.handle,
      xd: -this.data.xd,
      yd: -this.data.yd,
    });
  }
}

export class AddHandleAction extends HistoryAction {
  perform(editor) {
    for (let index of this.data.indexes) {
      let pp = editor.doc.getFromIndex(index);
      pp.setHandle(this.data.handle, this.data.posn);
      if (this.data.reflect) {
        pp.reflectHandle(this.data.handle);
      }
    }
  }

  opposite() {
    return new RemoveHandleAction({
      indexes: this.data.indexes,
      reflect: this.data.reflect
    });
  }
}

export class RemoveHandleAction extends HistoryAction {
  perform(editor) {
    for (let index of this.data.indexes) {
      let pp = editor.doc.getFromIndex(index);
      pp.unsetHandle(this.data.handle);
      if (this.data.reflect) {
        pp.unsetHandle(this.data.handle === 'pHandle' ? 'sHandle' : 'pHandle');
      }
    }
  }
}

export class InsertAction extends HistoryAction {
  constructor(data) {
    super(data);

    // Ensure items are sorted by index
    data.items.sort((a, b) => {
      return a.index.compare(b.index);
    });
  }

  perform(editor) {
    let indexes = [];
    for (let pair of this.data.items) {
      let { item, index } = pair;
      let parent = editor.doc;
      // Traverse the object tree to find the item's immediate parent
      for (let pi of index.parts.slice(0,-1)) {
        parent = parent.child(pi);
      }

      parent.insert(item, index.last);

      indexes.push(index);

      editor.doc.cacheIndexes();
    }

    editor.trigger('change');
    editor.calculateSelectionBounds();
    editor.trigger('change:selection');
  }

  opposite() {
    return new DeleteAction({ items: this.data.items });
  }
}

export class DeleteAction extends HistoryAction {
  constructor(data) {
    super(data);

    // Ensure items are sorted by index
    data.items.sort((a, b) => {
      return a.index.compare(b.index);
    });
  }

  perform(editor) {
    let indexes = this.data.items.map((item) => {
      return item.index;
    });

    editor.doc.removeIndexes(indexes);

    editor.trigger('change');
    editor.calculateSelectionBounds();
    editor.trigger('change:selection');
    editor.setSelection([]);
  }

  opposite() {
    return new InsertAction({ items: this.data.items });
  }
}
