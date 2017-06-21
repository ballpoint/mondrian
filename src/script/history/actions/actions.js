import Path from 'geometry/path';
import PathPoint from 'geometry/path-point';
import Item from 'geometry/item';

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
    editor.selectFromIndexes(this.data.indexes);
    for (let item of editor.state.selection) {
      item.nudge(this.data.xd, this.data.yd);
      
      if (item instanceof Path) {
        item.clearCachedObjects();
      } else if (item instanceof PathPoint && item.owner) {
        item.owner.clearCachedObjects();
      }
    }
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

export class NudgeHandleAction extends HistoryAction {
  perform(editor) {
    let points = this.data.indexes.map((q) => { return editor.doc.getFromIndex(q) });
    editor.setSelection(points);
    for (let point of points) {
      point.nudgeHandle(this.data.handle, this.data.xd, this.data.yd);
    }
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

export class ScaleAction extends HistoryAction {
  perform(editor) {
    editor.selectFromIndexes(this.data.indexes);
    for (let item of editor.state.selection) {
      item.scale(this.data.x, this.data.y, this.data.origin);
    }
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

export class InsertAction extends HistoryAction {
  constructor(data) {
    super(data);

    // Ensure items are sorted by index
    data.items.sort((a, b) => {
      return a.index.compare(b.index);
    });
  }

  perform(editor) {
    for (let pair of this.data.items) {
      let { item, index } = pair;
      let parent = editor.doc;
      // Traverse the object tree to find the item's immediate parent
      for (let pi of index.parts.slice(0,-1)) {
        parent = parent.child(pi);
      }

      console.log(parent, item, index.last);
      parent.insert(item, index.last);

      editor.doc.cacheIndexes();
    }
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
  }

  opposite() {
    return new InsertAction({ items: this.data.items });
  }
}
