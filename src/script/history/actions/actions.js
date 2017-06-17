import Path from 'geometry/path';
import PathPoint from 'geometry/path-point';
import Monsvg from 'geometry/monsvg';

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
    editor.selectFromQueries(this.data.query);
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
      query: this.data.query,
      xd:   -this.data.xd,
      yd:   -this.data.yd
    });
  }
}

export class NudgeHandleAction extends HistoryAction {
  perform(editor) {
    let points = this.data.query.map((q) => { return editor.doc.getItemFromQuery(q) });
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
      query: this.data.query,
      handle: this.data.handle,
      xd: -this.data.xd,
      yd: -this.data.yd,
    });
  }
}

export class ScaleAction extends HistoryAction {
  perform(editor) {
    editor.selectFromQueries(this.data.query);
    for (let item of editor.state.selection) {
      item.scale(this.data.x, this.data.y, this.data.origin);
    }
  }

  opposite() {
    return new ScaleAction({
      origin: this.data.origin,
      query: this.data.query,
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
    let queries = this.data.items.map((item) => {
      return item.query;
    });

    let marked = queries.map(editor.doc.getItemFromQuery.bind(editor.doc));

    for (let item of marked) {
      if (item instanceof Monsvg) {
        editor.doc.removeMonsvg(item);
      } else if (item instanceof PathPoint) {
        editor.doc.removePathPoint(item);
      }
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
}
