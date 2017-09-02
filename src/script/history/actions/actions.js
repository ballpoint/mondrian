import Path from 'geometry/path';
import PathPoint from 'geometry/path-point';
import Item from 'geometry/item';
import Group from 'geometry/group';
import { indexesIdentical } from 'geometry/index';

export class HistoryAction {
  constructor(data) {
    this.data = data;
    this.created = new Date();
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
    for (let index of this.data.indexes) {
      let item = doc.getFromIndex(index);
      item.rotate(this.data.a, this.data.origin);
    }
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
  get displayTitle() {
    return 'Move handle';
  }

  perform(doc) {
    let points = this.data.indexes.map(q => {
      return doc.getFromIndex(q);
    });
    for (let point of points) {
      point.nudgeHandle(this.data.handle, this.data.xd, this.data.yd);

      if (point.path) {
        point.path.clearCachedObjects();
      }
    }
  }

  opposite() {
    return new NudgeHandleAction({
      indexes: this.data.indexes,
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
    for (let index of this.data.indexes) {
      let pp = doc.getFromIndex(index);
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
  get displayTitle() {
    return 'Remove handle';
  }

  perform(doc) {
    for (let index of this.data.indexes) {
      let pp = doc.getFromIndex(index);
      pp.unsetHandle(this.data.handle);
      if (this.data.reflect) {
        pp.unsetHandle(this.data.handle === 'pHandle' ? 'sHandle' : 'pHandle');
      }
    }
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
      parent.insert(item, index.last);
      doc.cacheIndexes();
    }
  }

  opposite() {
    return new DeleteAction({
      items: this.data.items
    });
  }
}

export class DeleteAction extends HistoryAction {
  get displayTitle() {
    return 'Delete';
  }

  static forItems(items) {
    return new DeleteAction({
      items: items.map(item => {
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
    let indexes = this.data.items.map(item => {
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

export class SplitPathAction extends HistoryAction {
  static forPoint(doc, point) {
    let segment = doc.getFromIndex(point.index.parent);
    return new SplitPathAction({
      splitIndex: point.index
    });
  }

  perform(doc) {
    let path = doc.getFromIndex(this.data.splitIndex.parent.parent);

    let pl = path.points.popSlice(
      this.data.splitIndex.parent.last,
      this.data.splitIndex.last
    );

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

    path.points.replaceSegment(
      segment,
      segment.concat(newPath.points.segments[0])
    );

    doc.removeIndexes([newPathIndex]);
  }

  opposite() {
    return new SplitPathAction({
      splitIndex: this.data.splitIndex
    });
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
      .map(child => {
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

    let items = indexes.map(index => {
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
      item.data[this.data.key] = group.value;
      if (item.clearCache) item.clearCache();
    }
  }

  opposite() {
    return new SetAttributeAction({
      key: this.data.key,
      items: this.data.items.map(item => {
        return {
          index: item.index,
          value: item.oldValue,
          oldValue: item.value
        };
      })
    });
  }
}
