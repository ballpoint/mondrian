import HistoryFrame from 'history/Frame';
import * as actions from 'history/actions/actions';
import EventEmitter from 'lib/events';

export default class DocHistory extends EventEmitter {
  constructor(frames = []) {
    super();
    this._nextFrameId = 1;
    this._currentIndex = -1;

    this.frames = frames;
    this.staged = undefined;

    if (this.frames.length === 0) {
      let initFrame = new HistoryFrame([
        new actions.InitAction() // TODO shove doc in here
      ]);
      this.stageFrame(initFrame);
      this.commitFrame();
    }
  }

  get head() {
    return this.frames[this._currentIndex];
  }

  stageFrame(frame, doc) {
    if (frame.empty) return;

    this.resetStage(doc);

    for (let action of frame.actions) {
      action.perform(doc);
    }

    this.staged = frame;

    return;
  }

  resetStage(doc) {
    if (this.staged && !this.staged.committed) {
      this.staged.undo(doc);
      delete this.staged;
    }
  }

  commitFrame() {
    if (!this.staged) return;

    this.frames = this.frames.slice(0, this._currentIndex + 1);

    this.frames.push(this.staged);
    this.staged.commit();

    this.staged.id = this._nextFrameId;
    this._nextFrameId++;

    this._currentIndex++;

    delete this.staged;
    this.trigger('commit');
  }

  abandonFrame(doc) {
    this.resetState();
  }

  pushAction(action, doc) {
    action.perform(doc);

    if (!this.head.committed) {
      this.head.actions.push(action);
    } else {
      let nf = new HistoryFrame([action]);
      // TODO maybe pushing an action when no unstaged head is an error
      this.stageFrame(nf);
    }
  }

  canUndo() {
    return this._currentIndex > 0;
  }

  undo(doc) {
    if (this.canUndo()) {
      this.head.undo(doc);
      this._currentIndex--;
    }
  }

  canRedo() {
    return this.frames.length - 1 > this._currentIndex;
  }

  redo(doc) {
    if (this.canRedo()) {
      this.frames[this._currentIndex + 1].perform(doc);
      this._currentIndex++;
    }
  }

  jumpToDepth(doc, d) {
    let delta = this.head.depth - d;
    if (delta === 0) {
      return;
    } else if (delta < 0) {
      for (let i = 0; i < Math.abs(delta); i++) {
        this.redo(doc);
      }
    } else if (delta > 0) {
      for (let i = 0; i < delta; i++) {
        this.undo(doc);
      }
    }
  }
}
