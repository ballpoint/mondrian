import Path from 'geometry/path';
import PathPoint from 'geometry/path-point';
import Item from 'geometry/item';
import Group from 'geometry/group';
import { indexesIdentical } from 'geometry/index';

export class HistoryAction {
  constructor(data) {
    this.data = data;
  }
}

export class InitAction extends HistoryAction {
  get displayTitle() {
    return 'Initialize document';
  }

  perform(doc) {}
}

export class NudgeAction extends HistoryAction {
  get displayTitle() {
    return 'Move';
  }

  perform(doc) {
    for (let index of this.data.indexes) {
      let item = doc.getFromIndex(index);
      item.nudge(this.data.xd, this.data.yd);

      if (item instanceof Path) {
        item.clearCachedObjects();
      } else if (item instanceof PathPoint && item.path) {
        item.path.clearCachedObjects();
      }
    }
  }

  opposite() {
    return new NudgeAction({
      indexes: this.data.indexes,
      xd: -this.data.xd,
      yd: -this.data.yd
    });
  }
}

export class ScaleAction extends HistoryAction {
  get displayTitle() {
    return 'Scale';
  }

  perform(doc) {
    for (let index of this.data.indexes) {
      let item = doc.getFromIndex(index);
      if (item) {
        item.scale(this.data.x, this.data.y, this.data.origin);
      } // TODO handle else case?
    }
  }

  opposite() {
    return new ScaleAction({
      origin: this.data.origin,
      indexes: this.data.indexes,
      x: 1 / this.data.x,
      y: 1 / this.data.y
    });
  }
}

export class RotateAction extends HistoryAction {
  get displayTitle() {
    return 'Rotate';
  }

  perform(doc) {
    if (this.data.angle == 0) return;

    let items = this.data.indexes.map((index) => {
      return doc.getFromIndex(index);
    });

    for (let item of items) {
      item.rotate(this.data.angle, this.data.origin);
    }
  }

  opposite() {
    return new RotateAction({
      indexes: this.data.indexes,
      angle: -this.data.angle,
      origin: this.data.origin
    });
  }
}

export class NudgeHandleAction extends HistoryAction {
  get displayTitle() {
    return 'Move handle';
  }

  perform(doc) {
    let point = doc.getFromIndex(this.data.index);
    point.nudgeHandle(this.data.handle, this.data.xd, this.data.yd);
    if (point.path) {
      point.path.clearCachedObjects();
    }
  }

  opposite() {
    return new NudgeHandleAction({
      index: this.data.index,
      handle: this.data.handle,
      xd: -this.data.xd,
      yd: -this.data.yd
    });
  }
}

export class AddHandleAction extends HistoryAction {
  get displayTitle() {
    return 'Add handle';
  }

  perform(doc) {
    let pp = doc.getFromIndex(this.data.index);
    if (!(pp instanceof PathPoint)) {
      // Fuck
      console.warn('Invalid invocation: not a PathPoint', pp);
      return;
    }
    pp.setHandle(this.data.handle, this.data.posn);
    if (this.data.reflect) {
      pp.reflectHandle(this.data.handle);
    }
  }

  opposite() {
    return new RemoveHandleAction(this.data);
  }
}

export class RemoveHandleAction extends HistoryAction {
  get displayTitle() {
    return 'Remove handle';
  }

  static forPoint(point, handle) {
    let posn = point[handle];
    return new RemoveHandleAction({
      index: point.index,
      reflect: false,
      handle,
      posn
    });
  }

  perform(doc) {
    let pp = doc.getFromIndex(this.data.index);

    if (!(pp instanceof PathPoint)) {
      // Fuck
      console.warn('Invalid invocation: not a PathPoint', pp);
      return;
    }

    pp.unsetHandle(this.data.handle);
    if (this.data.reflect) {
      pp.unsetHandle(this.data.handle === 'pHandle' ? 'sHandle' : 'pHandle');
    }
  }

  opposite() {
    return new AddHandleAction(this.data);
  }
}

export class InsertAction extends HistoryAction {
  static forItem(parent, item) {
    return new InsertAction({
      items: [
        {
          index: parent.nextChildIndex(),
          item
        }
      ]
    });
  }

  get displayTitle() {
    return 'Insert Shapes';
  }

  constructor(data) {
    super(data);

    // Ensure items are sorted by index
    data.items = data.items.slice(0).sort((a, b) => {
      return a.index.compare(b.index);
    });
  }

  perform(doc) {
    for (let pair of this.data.items) {
      let { item, index } = pair;
      let parent = doc.getFromIndex(index.parent);
      parent.insert(item.clone(), index.last);
      doc.cacheIndexes();
    }
  }

  opposite() {
    return new RemoveAction({
      items: this.data.items
    });
  }
}

export class RemoveAction extends HistoryAction {
  get displayTitle() {
    return 'Delete';
  }

  static forItems(items) {
    return new RemoveAction({
      items: items.map((item) => {
        return {
          index: item.index,
          item
        };
      })
    });
  }

  constructor(data) {
    super(data);

    // Ensure items are sorted by index
    data.items = data.items.slice(0).sort((a, b) => {
      return b.index.compare(a.index);
    });
  }

  perform(doc) {
    let indexes = this.data.items.map((item) => {
      return item.index;
    });

    doc.removeIndexes(indexes);
    doc.cacheIndexes();
  }

  opposite() {
    return new InsertAction({ items: this.data.items });
  }
}

export class ShiftSegmentAction extends HistoryAction {
  perform(doc) {
    let segment = doc.getFromIndex(this.data.index);
    segment.shift(this.data.n);
    doc.cacheIndexes();
  }

  opposite() {
    return new ShiftSegmentAction({
      index: this.data.index,
      n: -this.data.n
    });
  }
}

export class ReverseSegmentAction extends HistoryAction {
  perform(doc) {
    let segment = doc.getFromIndex(this.data.index);
    segment.reverse();
    doc.cacheIndexes();
  }

  opposite() {
    return this;
  }
}

export class CloseSegmentAction extends HistoryAction {
  perform(doc) {
    let segment = doc.getFromIndex(this.data.index);
    segment.close();
  }

  opposite() {
    return new OpenSegmentAction(this.data);
  }
}

export class OpenSegmentAction extends HistoryAction {
  perform(doc) {
    let segment = doc.getFromIndex(this.data.index);
    segment.open();
  }

  opposite() {
    return new CloseSegmentAction(this.data);
  }
}

export class UngroupAction extends HistoryAction {
  static forGroup(doc, group) {
    // Constructor helper which pre-determines the resulting
    // childIndexes for us, given an existing group.

    let groupIndex = group.index;
    let childIndexes = [];

    let childIndex = group.index.clone();
    for (let i = 0; i < group.children.length; i++) {
      childIndexes.push(childIndex);
      childIndex = childIndex.plus(1);
    }

    return new UngroupAction({
      groupIndex,
      childIndexes
    });
  }

  get displayTitle() {
    return 'Ungroup';
  }

  perform(doc) {
    let { groupIndex, childIndexes } = this.data;
    let item = doc.getFromIndex(groupIndex);

    if (!(item instanceof Group)) {
      console.warn('Warning: UngroupAction on non-group', item);
    } else {
      let parent = doc.getFromIndex(item.index.parent);
      parent.remove(item);

      let children = item.children.slice(0);
      childIndexes = childIndexes.slice(0);

      for (let i = 0; i < children.length; i++) {
        let child = children[i];
        let index = childIndexes[i];
        let parent = doc.getFromIndex(index.parent);
        parent.insert(child, index.last);

        // TODO optimize this:
        doc.cacheIndexes();
      }
    }
  }

  opposite() {
    return new GroupAction({
      groupIndex: this.data.groupIndex,
      childIndexes: this.data.childIndexes
    });
  }
}

export class GroupAction extends HistoryAction {
  static forChildren(doc, children) {
    let childIndexes = children
      .map((child) => {
        return child.index;
      })
      .sort((a, b) => {
        return a.compare(b);
      });

    let groupIndex = childIndexes.last();
    for (let index of childIndexes.slice(0, -1)) {
      groupIndex = groupIndex.plusAt(-1, index.depth);
    }

    return new GroupAction({
      childIndexes,
      groupIndex
    });
  }

  get displayTitle() {
    return 'Group';
  }

  perform(doc) {
    let indexes = this.data.childIndexes;

    let items = indexes.map((index) => {
      return doc.getFromIndex(index);
    });

    let group = new Group(items);

    doc.removeIndexes(indexes);

    let parent = doc.getFromIndex(this.data.groupIndex.parent);
    parent.insert(group, this.data.groupIndex.last);

    doc.cacheIndexes();
  }

  sortedIndexes() {
    return this.data.childIndexes.sort((a, b) => {
      return a.compare(b);
    });
  }

  opposite() {
    return new UngroupAction({
      groupIndex: this.data.groupIndex,
      childIndexes: this.data.childIndexes
    });
  }
}

export class SplitPathAction extends HistoryAction {
  static forPoint(doc, point) {
    let segment = doc.getFromIndex(point.index.parent);
    return new SplitPathAction({
      splitIndex: point.index
    });
  }

  perform(doc) {
    let path = doc.getFromIndex(this.data.splitIndex.parent.parent);

    let pl = path.points.popSlice(this.data.splitIndex.parent.last, this.data.splitIndex.last);

    let p2 = path.clone();
    p2.setPoints(pl);

    let pathParent = doc.getFromIndex(path.index.parent);
    pathParent.insert(p2, path.index.last + 1);

    doc.cacheIndexes();
  }

  opposite() {
    return new UnsplitPathAction({
      splitIndex: this.data.splitIndex
    });
  }
}

export class UnsplitPathAction extends HistoryAction {
  perform(doc) {
    let pathIndex = this.data.splitIndex.parent.parent;
    let newPathIndex = pathIndex.plus(1);
    let path = doc.getFromIndex(pathIndex);
    let newPath = doc.getFromIndex(newPathIndex);

    // Append contents of newPath to the segment containing splitIndex

    let segment = doc.getFromIndex(this.data.splitIndex.parent);

    path.points.replaceSegment(segment, segment.concat(newPath.points.segments[0]));

    doc.removeIndexes([newPathIndex]);
  }

  opposite() {
    return new SplitPathAction({
      splitIndex: this.data.splitIndex
    });
  }
}

export class ToggleMetadataBoolAction extends HistoryAction {
  get displayTitle() {
    return 'Toggle Metadata';
  }

  perform(doc) {
    for (let index of this.data.indexes) {
      let item = doc.getFromIndex(index);
      item.metadata[this.data.key] = !item.metadata[this.data.key];
    }
  }

  opposite() {
    // This will inverse itself
    return this;
  }
}

export class SetDocDimensionsAction extends HistoryAction {
  get displayTitle() {
    return 'Resize document';
  }

  static forDoc(doc, width, height) {
    return new SetDocDimensionsAction({
      width,
      height,
      prevWidth: doc.width,
      prevHeight: doc.height
    });
  }

  perform(doc) {
    doc.setDimens(this.data.width, this.data.height);
  }

  opposite() {
    return new SetDocDimensionsAction({
      width: this.data.prevWidth,
      height: this.data.prevHeight,
      prevWidth: this.data.width,
      prevHeight: this.data.height
    });
  }
}

export class SetDocNameAction extends HistoryAction {
  get displayTitle() {
    return 'Rename document';
  }

  static forDoc(doc, name) {
    return new SetDocNameAction({
      name,
      prevName: doc.name
    });
  }

  perform(doc) {
    doc.setName(this.data.name);
  }

  opposite() {
    return new SetDocNameAction({
      name: this.data.prevName,
      prevName: this.data.name
    });
  }
}

export class SetAttributeAction extends HistoryAction {
  static forItems(items, key, value) {
    let d = [];
    for (let item of items) {
      d.push({
        index: item.index,
        oldValue: item.data[key],
        value
      });
    }

    return new SetAttributeAction({ items: d, key });
  }

  perform(doc) {
    for (let group of this.data.items) {
      let item = doc.getFromIndex(group.index);
      let value = group.value;
      if (_.isFunction(value.clone)) {
        value = value.clone();
      }
      item.data[this.data.key] = value;
      if (item.clearCache) item.clearCache();
    }
  }

  opposite() {
    return new SetAttributeAction({
      key: this.data.key,
      items: this.data.items.map((item) => {
        return {
          index: item.index,
          value: item.oldValue,
          oldValue: item.value
        };
      })
    });
  }
}

export class ShiftIndexAction extends HistoryAction {
  perform(doc) {
    let positive = this.data.items[0].delta > 0;
    let items = this.data.items.slice(0).sort((a, b) => {
      if (positive) {
        return b.index.compare(a.index);
      } else {
        return a.index.compare(b.index);
      }
    });

    for (let item of items) {
      let { index, delta } = item;
      doc.shiftIndex(index, delta);
    }
  }

  opposite() {
    return new ShiftIndexAction({
      items: this.data.items.map((item) => {
        return {
          index: item.index.plus(item.delta),
          delta: -item.delta
        };
      })
    });
  }
}
