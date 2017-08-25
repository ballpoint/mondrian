import { PIXEL_RATIO } from 'lib/math';
import { scaleLinear } from 'd3-scale';
import consts from 'consts';
import Color from 'ui/color';
import SelectedColors from 'ui/SelectedColors';
import SelectedStrokeStyle from 'ui/SelectedStrokeStyle';
import EventEmitter from 'lib/events';
import Canvas from 'ui/canvas';

import Posn from 'geometry/posn';
import Group from 'geometry/group';
import Index from 'geometry/index';
import Path from 'geometry/path';
import PathPoint from 'geometry/path-point';
import PointsSegment from 'geometry/points-segment';

import Layer from 'io/layer';

import HistoryFrame from 'history/Frame';
import * as actions from 'history/actions/actions';

import Projection from 'ui/projection';
import HotkeyTracking from 'ui/hotkeys';
import Bounds from 'geometry/bounds';
import Element from 'ui/element';
import CursorTracking from 'ui/cursor-tracking';
import CursorHandler from 'ui/cursor-handler';

import * as tools from 'ui/tools/tools';
import RulersUIElement from 'ui/editor/rulers';
import TransformerUIElement from 'ui/editor/transformer';
import DocumentPointsUIElement from 'ui/editor/doc_pts';
import DocumentElemsUIElement from 'ui/editor/doc_elems';

const UTILS_WIDTH = 350 + 220;

export default class Editor extends EventEmitter {
  constructor(root) {
    super();

    window.$e = this; // DEBUGGING

    if (root) {
      this.root = root;
      this.initCanvas();
      this.initState();
    }

    // Handle print view
    this.on(
      'change',
      _.debounce(() => {
        // TODO handle this only when going into print mode
        // with cross-browser solution
        let printView = document.getElementById('print-view');
        if (printView) {
          printView.innerHTML = this.doc.toSVG();
        }
      }, 1000)
    );
  }

  load(doc) {
    this.doc = doc;

    window.h = this.doc.history;

    this.setPosition(doc.center());
    this.fitToScreen();
    this.setCurrentLayer(doc.layers[0]);

    this.canvas.refreshAll();

    this.trigger('change');
    this.trigger('change:doc');
  }

  save() {}

  initCanvas() {
    this.canvas = new Canvas(this.root);
    this.cursor = new CursorTracking(this.root);
    this.cursorHandler = new CursorHandler(this.cursor);

    // UIElements
    let uiElems = [
      new DocumentPointsUIElement(this, 'doc-pts'),
      new DocumentElemsUIElement(this, 'doc-elems'),
      new TransformerUIElement(this, 'transformer'),
      new RulersUIElement(this, 'rulers')
    ];

    this.canvas.createLayer('background', this.refreshBackground.bind(this));
    this.canvas.createLayer('drawing', this.refreshDrawing.bind(this));
    this.canvas.createLayer('tool', this.refreshTool.bind(this));
    this.canvas.createLayer('ui', (layer, context) => {
      for (let elem of uiElems) {
        elem.refresh(layer, context);
      }
    });
    this.canvas.createLayer('debug', () => {});

    this.cursorHandler.on('mousemove', (e, cursor) => {
      if (e.propagateToTool) this.state.tool.handleMousemove(e, cursor);
      this.canvas.refresh('tool');
      this.canvas.refresh('ui');
    });

    this.cursorHandler.on('mouseup', (e, cursor) => {
      if (e.propagateToTool) this.state.tool.handleMouseup(e, cursor);
      this.canvas.refresh('tool');
      this.canvas.refresh('ui');
    });

    this.cursorHandler.on('mousedown', (e, cursor) => {
      if (e.propagateToTool) this.state.tool.handleMousedown(e, cursor);
      this.canvas.refresh('tool');
      this.canvas.refresh('ui');
    });

    this.cursorHandler.on('click', (e, cursor) => {
      if (e.propagateToTool) this.state.tool.handleClick(e, cursor);
      this.canvas.refresh('tool');
      this.canvas.refresh('ui');
    });

    this.cursorHandler.on('drag:start', (e, cursor) => {
      if (e.propagateToTool) this.state.tool.handleDragStart(e, cursor);
      this.canvas.refresh('tool');
      this.canvas.refresh('ui');
    });

    this.cursorHandler.on('drag', (e, cursor) => {
      if (e.propagateToTool) this.state.tool.handleDrag(e, cursor);
      this.canvas.refresh('tool');
      this.canvas.refresh('ui');
    });

    this.cursorHandler.on('drag:stop', (e, cursor) => {
      if (e.propagateToTool) this.state.tool.handleDragStop(e, cursor);
      this.canvas.refresh('tool');
      this.canvas.refresh('ui');
    });

    this.cursorHandler.on('scroll:x', (e, cursor) => {
      let delta = e.deltaX;
      if (!this.canvas.owns(e.target)) return;

      if (this.state.tool.id === 'zoom') {
      } else {
        this.nudge(this.projection.zInvert(delta), 0);
      }
    });

    this.cursorHandler.on('scroll:y', (e, cursor) => {
      let delta = e.deltaY;
      if (!this.canvas.owns(e.target)) return;

      if (this.state.tool.id === 'zoom') {
        let zd = 1 - delta / 1000;
        let anchor = this.cursor.lastPosn;
        this.setZoom(this.state.zoomLevel * zd, anchor);
      } else {
        this.nudge(0, this.projection.zInvert(delta));
      }
    });

    let hotkeys = new HotkeyTracking();

    hotkeys.on('down', 'downArrow', () => {
      this.nudgeSelected(0, 1);
      this.doc.commitFrame();
    });
    hotkeys.on('down', 'upArrow', () => {
      this.nudgeSelected(0, -1);
      this.doc.commitFrame();
    });
    hotkeys.on('down', 'leftArrow', () => {
      this.nudgeSelected(-1, 0);
      this.doc.commitFrame();
    });
    hotkeys.on('down', 'rightArrow', () => {
      this.nudgeSelected(1, 0);
      this.doc.commitFrame();
    });
    hotkeys.on('down', 'shift-downArrow', () => {
      this.nudgeSelected(0, 10);
      this.doc.commitFrame();
    });
    hotkeys.on('down', 'shift-rightArrow', () => {
      this.nudgeSelected(10, 0);
      this.doc.commitFrame();
    });
    hotkeys.on('down', 'shift-upArrow', () => {
      this.nudgeSelected(0, -10);
      this.doc.commitFrame();
    });
    hotkeys.on('down', 'shift-leftArrow', () => {
      this.nudgeSelected(-10, 0);
      this.doc.commitFrame();
    });

    hotkeys.on('down', 'ctrl-shift-G', e => {
      e.preventDefault();
      this.ungroupSelection();
    });

    hotkeys.on('down', 'ctrl-G', e => {
      e.preventDefault();
      this.groupSelection();
    });

    hotkeys.on('down', 'V', () => {
      this.selectTool(new tools.Cursor(this));
    });
    hotkeys.on('down', 'A', () => {
      this.selectTool(new tools.SubCursor(this));
    });
    hotkeys.on('down', 'Z', () => {
      this.selectTool(new tools.Zoom(this));
    });
    hotkeys.on('down', 'P', () => {
      this.selectTool(new tools.Pen(this));
    });
    hotkeys.on('down', 'space', () => {
      this.selectTool(new tools.Paw(this));
    });
    hotkeys.on('up', 'space', () => {
      this.selectTool(this.state.lastTool);
    });

    hotkeys.on('down', 'ctrl-A', e => {
      e.preventDefault();
      this.selectAll();
    });

    hotkeys.on('down', 'ctrl-O', e => {
      e.preventDefault();
      this.trigger('hotkey:open');
    });

    hotkeys.on('down', 'ctrl-S', e => {
      e.preventDefault();
      this.trigger('hotkey:save');
    });

    hotkeys.on('down', 'ctrl-E', e => {
      e.preventDefault();
      this.trigger('hotkey:export');
    });

    hotkeys.on('down', '1', () => {
      let center = this.doc.bounds.center();
      this.setPosition(center);
      this.setZoom(1);
    });
    hotkeys.on('down', '0', () => {
      this.fitToScreen();
    });

    hotkeys.on('down', '+', () => {
      this.zoomIn();
    });
    hotkeys.on('down', '-', () => {
      this.zoomOut();
    });

    hotkeys.on('down', 'backspace', () => {
      this.deleteSelection();
    });

    hotkeys.on('down', 'ctrl-Z', e => {
      e.preventDefault();
      this.undo();
    });
    hotkeys.on('down', 'ctrl-shift-Z', e => {
      e.preventDefault();
      this.redo();
    });

    /*
    hotkeys.on('down', 'ctrl-V', () => { 
      this.paste();
    });
    */

    document.addEventListener('copy', e => {
      this.copy(e);
    });
    document.addEventListener('paste', e => {
      this.paste(e);
    });

    this.canvas.refreshAll();
  }

  initState() {
    let cached = sessionStorage.getItem('editor:state');
    if (cached) {
      cached = JSON.parse(cached);
      this.state = {
        zoomLevel: cached.zoomLevel,
        position: new Posn(cached.position),
        selection: [],
        hovering: [],
        scope: new Index([0]),
        tool: new tools.Cursor(this),

        // Style
        colors: new SelectedColors(),
        stroke: new SelectedStrokeStyle()
      };
    } else {
      this.state = {
        zoomLevel: 1,
        selection: [],
        hovering: [],
        scope: new Index([0]),
        tool: new tools.Cursor(this),

        // Style
        colors: new SelectedColors(),
        stroke: new SelectedStrokeStyle()
      };
    }

    this.selectTool(new tools.Cursor(this));
  }

  cacheState() {
    sessionStorage.setItem(
      'editor:state',
      JSON.stringify({
        zoomLevel: this.state.zoomLevel,
        position: this.state.position
      })
    );
  }

  setPosition(posn) {
    this.state.position = posn;
    if (this.doc) {
      this.calculateScales();
    }
    this.canvas.refreshAll();
    this.cacheState();
  }

  nudge(x, y) {
    this.setPosition(this.state.position.nudge(x, y));
  }

  zoomIn() {
    this.setZoom(this.state.zoomLevel * 1.2);
  }

  zoomOut() {
    this.setZoom(this.state.zoomLevel * 0.8);
  }

  setZoom(zl, anchor = null) {
    zl = Math.min(100, Math.max(0.01, zl));

    this.state.zoomLevel = zl;

    let anchorBefore;
    if (anchor) {
      anchorBefore = this.projection.posnInvert(anchor);
    }

    if (this.doc) {
      this.calculateScales();
    }

    if (anchorBefore) {
      // Correct position to maintain anchor point
      let anchorAfter = this.projection.posnInvert(anchor);
      let xd = anchorAfter.x - anchorBefore.x;
      let yd = anchorAfter.y - anchorBefore.y;
      this.nudge(-xd, -yd);
    }

    this.canvas.refreshAll();
    this.cacheState();
  }

  fitToScreen() {
    const padding = 20;
    let vb = this.viewportBounds().padded(-padding);
    let fb = this.doc.bounds.fitTo(vb);

    let z = fb.width / this.doc.bounds.width;

    let center = this.doc.bounds.center();
    this.setPosition(center);
    this.setZoom(z);
  }

  clearSelection() {
    this.setSelection([]);
  }

  selectAll() {
    this.setSelection(this.doc.filterAvailable(this.doc.elements.slice(0)));
  }

  /*
  flattenGroupItems(items) {
    let finalItems = [];
    for (let item of items) {
      if ((item instanceof Path) || (item instanceof PathPoint)) {
        finalItems.push(item);
      } else if (item instanceof PointsSegment) {
        // Reduce PointsSegments to just the contained PathPoints
        finalItems = finalItems.concat(item.points);
      } else if ((item instanceof Group) || (item instanceof Layer)) {
        finalItems = finalItems.concat(item.childrenFlat);
      }
    }
    return finalItems;
  }
  */

  setSelection(items) {
    let oldSelection = this.state.selection;
    this.state.selection = items;

    if (items[0] instanceof PathPoint) {
      this.state.selectionType = 'POINTS';
    } else {
      this.state.selectionType = 'ELEMENTS';
    }

    window.$s = items; // DEBUG

    this.calculateSelectionBounds();

    if (!oldSelection.sameMembers(this.state.selection)) {
      this.trigger('change');
      this.trigger('change:selection');
    }

    this.canvas.refreshAll();
  }

  hasSelection() {
    return this.state.selection.length > 0;
  }

  setHovering(items) {
    let oldHovering = this.state.hovering;
    this.state.hovering = items;

    if (this.state.hovering.length > 0) {
      if (items[0] instanceof PathPoint) {
        this.state.hoveringType = 'POINTS';
      } else {
        this.state.hoveringType = 'ELEMENTS';
      }
    }

    if (!oldHovering.sameMembers(this.state.hovering)) {
      this.trigger('change');
      this.trigger('change:hovering');

      this.canvas.refresh('ui');
    }
  }

  isSelected(item) {
    if (item instanceof Layer) {
      return this.state.layer === item;
    } else {
      return this.state.selection.indexOf(item) > -1;
    }
  }

  setCurrentLayer(layer) {
    this.state.layer = layer;

    this.canvas.refreshAll();

    // defer
    setTimeout(() => {
      this.trigger('change');
      this.trigger('change:layer');
    }, 1);
  }

  selectTool(tool) {
    if (tool.constructor !== this.state.tool.constructor) {
      this.state.lastTool = this.state.tool;
    }
    this.state.tool = tool;

    this.canvas.refreshAll();
    this.calculateSelectionBounds();
    this.trigger('change');
    this.trigger('change:tool');
  }

  deleteSelection() {
    if (!this.hasSelection()) {
      return;
    }

    let frame;

    switch (this.state.selectionType) {
      case 'ELEMENTS':
        // Simple when removing elements; remove them whole
        frame = new HistoryFrame(
          [
            new actions.DeleteAction({
              items: this.state.selection.slice(0).map(item => {
                return { item, index: item.index };
              })
            })
          ],
          'Remove elements'
        );
        this.stageFrame(frame);
        break;
      case 'POINTS':
        // If we're removing points that's harder. We have to open and split
        // PointsSegments to handle this properly.
        let selection = this.state.selection.slice(0);

        let as = [];

        for (let i = 0; i < selection.length; i++) {
          let point = selection[i];
          let index = point.index;

          console.log('DEL', index.toString());

          let segmentIndex = index.parent;
          let segment = this.doc.getFromIndex(segmentIndex);
          let path = this.doc.getFromIndex(segmentIndex.parent);

          if (segment.closed) {
            // If we have a closed segment, we just remove the point and open it
            as.push(actions.DeleteAction.forItems([point]));
            as.push(
              new actions.ShiftSegmentAction({
                index: segmentIndex,
                n: index.last
              })
            );

            as.push(new actions.OpenSegmentAction({ index: segmentIndex }));
          } else if (point === segment.first || point === segment.last) {
            as.push(actions.DeleteAction.forItems([point]));
          } else {
            // If the segment is already open, we split it into two segments
            as.push(actions.DeleteAction.forItems([point]));
            as.push(actions.SplitSegmentAction.forPoint(this.doc, point));
          }
          frame = new HistoryFrame(as.slice(0), 'Remove points');
          console.log('stage', frame.actions.length);
          this.stageFrame(frame);
        }
    }

    this.setSelection([]);

    this.cleanUpEmptyItems(frame.actions[0]);
    this.commitFrame();
  }

  cleanUpEmptyItems(action) {
    let markedForRemoval = [];
    for (let pair of action.data.items) {
      let { index, item } = pair;

      let toRemove;
      let parent = item;

      while (true) {
        let index = parent.index;
        let nextParent = this.doc.getFromIndex(index.parent);
        if (!nextParent) break;

        // We don't remove empty layers;
        if (nextParent instanceof Layer) break;

        if (nextParent.empty) {
          toRemove = nextParent;
          parent = nextParent;
        } else {
          break;
        }
      }

      if (toRemove && markedForRemoval.indexOf(toRemove) === -1) {
        markedForRemoval.push(toRemove);
      }
    }

    if (markedForRemoval.length > 0) {
      let cleanUpAction = new actions.DeleteAction({
        items: markedForRemoval.map(item => {
          return { item, index: item.index };
        })
      });

      this.perform(cleanUpAction);
    }
  }

  ungroupSelection() {
    let groupsSelected = this.state.selection.filter(item => {
      return item instanceof Group;
    });

    if (groupsSelected.length === 0) {
      return;
    }

    groupsSelected = groupsSelected.sort((a, b) => {
      return a.index.compare(b.index);
    });

    let frame = new HistoryFrame(
      groupsSelected.map(g => {
        return actions.UngroupAction.forGroup(this.doc, g);
      })
    );

    this.stageFrame(frame);
    this.commitFrame();

    // Select new group
    let newIndexes = frame.actions.reduce((a, b) => {
      return a.concat(b.data.childIndexes);
    }, []);
    this.selectFromIndexes(newIndexes);
  }

  groupSelection() {
    if (!this.hasSelection()) return;

    let frame = new HistoryFrame([
      actions.GroupAction.forChildren(this.doc, this.state.selection)
    ]);

    this.stageFrame(frame);
    this.commitFrame();

    // Select new group
    let newIndex = frame.actions[0].data.groupIndex;
    this.selectFromIndexes([newIndex]);
  }

  insertElements(elems) {
    let items = [];
    let parent = this.doc.getFromIndex(this.state.scope);
    let nextIndex = parent.nextChildIndex();

    for (let item of elems) {
      items.push({ item, index: nextIndex });
      nextIndex.plus(1);
    }

    let action = new actions.InsertAction({ items });

    this.perform(action);
  }

  updateSelection() {
    // Filter out deleted items
    this.state.selection = this.state.selection.filter(item => {
      return this.doc.getFromIndex(item.index) === item;
    });

    this.state.hovering = this.state.hovering.filter(item => {
      return this.doc.getFromIndex(item.index) === item;
    });
  }

  calculateSelectionBounds() {
    let selectionBounds = {};

    this.updateSelection();

    if (this.hasSelection()) {
      let bounds;
      let angle = 0;
      let center;

      if (this.state.selectionType === 'ELEMENTS') {
        let selectedAngles = _.uniq(
          this.state.selection.map(e => {
            return e.metadata.angle;
          })
        );
        if (selectedAngles.length === 1) {
          angle = selectedAngles[0];
        }

        let boundsList = [];

        for (let elem of this.state.selection) {
          if (angle !== 0) {
            elem.rotate(-angle, new Posn(0, 0));
          }
          boundsList.push(elem.bounds());
          if (angle !== 0) {
            elem.rotate(angle, new Posn(0, 0));
          }
        }

        bounds = new Bounds(boundsList);
        center = bounds.center();
      } else if (this.state.selectionType === 'POINTS') {
        let selectedAngles = _.uniq(
          this.state.selection.map(e => {
            return e.path.metadata.angle;
          })
        );
        if (selectedAngles.length === 1) {
          angle = selectedAngles[0];
        }

        if (angle !== 0) {
          for (let pt of this.state.selection) {
            pt.rotate(-angle, new Posn(0, 0));
          }
        }
        bounds = Bounds.fromPosns(this.state.selection);
        if (angle !== 0) {
          for (let pt of this.state.selection) {
            pt.rotate(angle, new Posn(0, 0));
          }
        }

        center = bounds.center();
      }

      if (angle) {
        center = center.rotate(angle, new Posn(0, 0));
        bounds.centerOn(center);
        bounds.angle = angle;
      }

      selectionBounds.bounds = bounds;
      selectionBounds.angle = angle;
      selectionBounds.center = center;
    }

    this.state.selectionBounds = selectionBounds;
  }

  selectedIndexes() {
    return this.state.selection
      .map(item => {
        return item.index;
      })
      .filter(index => {
        if (index === null) {
          console.warn('null index in history!');
          return false;
        } else {
          return true;
        }
      })
      .sort((a, b) => {
        return a.compare(b);
      });
  }

  selectFromIndexes(indexes) {
    let sel = indexes.map(index => {
      return this.doc.getFromIndex(index);
    });

    this.setSelection(sel);
  }

  refreshDrawing(layer, context) {
    if (this.doc) {
      this.doc.drawToCanvas(layer, context, this.projection);
    }
  }

  calculateScales() {
    // Calculate scales
    let offsetLeft =
      (this.canvas.width - this.doc.width * this.state.zoomLevel) / 2;
    offsetLeft +=
      (this.doc.width / 2 - this.state.position.x) * this.state.zoomLevel;
    let offsetTop =
      (this.canvas.height - this.doc.height * this.state.zoomLevel) / 2;
    offsetTop +=
      (this.doc.height / 2 - this.state.position.y) * this.state.zoomLevel;

    // Account for windows on right side
    offsetLeft -= UTILS_WIDTH / 2;
    // Rulers
    offsetTop += 20 / 2;
    offsetLeft += 20 / 2;

    let x = scaleLinear()
      .domain([0, this.doc.width])
      .range([offsetLeft, offsetLeft + this.doc.width * this.state.zoomLevel]);

    let y = scaleLinear()
      .domain([0, this.doc.height])
      .range([offsetTop, offsetTop + this.doc.height * this.state.zoomLevel]);

    this.projection = new Projection(x, y, this.state.zoomLevel);

    this.cursorHandler.projection = this.projection;
  }

  docBounds() {
    return new Bounds(0, 0, this.doc.width, this.doc.height);
  }

  screenBounds() {
    return this.projection.bounds(
      new Bounds(0, 0, this.doc.width, this.doc.height)
    );
  }

  viewportBounds() {
    let b = this.canvas.bounds();
    // Account for ruler
    b.moveEdge('l', 20);
    b.moveEdge('t', 20);
    // Account for utils
    b.moveEdge('r', -UTILS_WIDTH);
    return b;
  }

  refreshBackground(layer, context) {
    layer.setFill(consts.bgGrey);
    context.fillRect(0, 0, layer.width, layer.height);

    // Draw white background
    if (this.doc) {
      let bounds = this.screenBounds();
      layer.drawRect(bounds, { fill: new Color('#ffffff') });
    }
  }

  nudgeSelected(xd, yd) {
    if (!this.hasSelection()) {
      return;
    }

    let frame = new HistoryFrame([
      new actions.NudgeAction({
        indexes: this.selectedIndexes(),
        xd,
        yd
      })
    ]);

    this.stageFrame(frame);
  }

  nudgeHandle(index, handle, xd, yd) {
    if (!this.hasSelection()) {
      return;
    }

    let frame = new HistoryFrame([
      new actions.NudgeHandleAction({
        indexes: [index],
        xd,
        yd,
        handle
      })
    ]);

    this.perform(frame);
  }

  scaleSelected(x, y, origin) {
    if (!this.hasSelection()) {
      return;
    }

    let frame = new HistoryFrame([
      new actions.ScaleAction({
        indexes: this.selectedIndexes(),
        x,
        y,
        origin
      })
    ]);

    this.stageFrame(frame);
  }

  rotateSelected(angle, origin) {
    if (!this.hasSelection()) {
      return;
    }

    let frame = new HistoryFrame([
      new actions.RotateAction({
        indexes: this.selectedIndexes(),
        a: angle,
        origin
      })
    ]);

    this.stageFrame(frame);
  }

  setDocDimens(width, height) {
    let frame = new HistoryFrame([
      actions.SetDocDimensionsAction.forDoc(this.doc, width, height)
    ]);

    this.stageFrame(frame);
    this.commitFrame();

    this.canvas.refreshAll();
    this.trigger('change');
  }

  stageFrame(frame) {
    this.doc.stageFrame(frame);
    this.calculateSelectionBounds();
    this.canvas.refreshAll();
    this.trigger('change');
  }

  commitFrame(frame) {
    this.doc.commitFrame();
  }

  perform(h) {
    this.doc.perform(h);
    this.calculateSelectionBounds();
    this.canvas.refreshAll();
    this.trigger('change');
  }

  undo() {
    this.doc.undo();
    this.calculateSelectionBounds();
    this.canvas.refreshAll();
    this.trigger('change');
    this.trigger('history:step');
  }

  redo() {
    this.doc.redo();
    this.calculateSelectionBounds();
    this.canvas.refreshAll();
    this.trigger('change');
    this.trigger('history:step');
  }

  jumpToHistoryDepth(depth) {
    this.doc.jumpToHistoryDepth(depth);
    this.calculateSelectionBounds();
    this.canvas.refreshAll();
    this.trigger('change');
    this.trigger('history:step');
  }

  cut(e) {
    this.state.clipboard = this.state.selection.map(e => {
      return e.clone();
    });
    this.deleteSelection();
    this.trigger('change');
  }

  copy(e) {
    this.state.clipboard = this.state.selection.map(e => {
      return e.clone();
    });
    this.trigger('change');
  }

  paste(e) {
    if (this.state.clipboard) {
      this.insertElements(this.state.clipboard);
    }
    this.trigger('change');
  }

  refreshTool(layer, context) {
    this.state.tool.refresh(layer, context);
  }
}
