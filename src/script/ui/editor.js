import { PIXEL_RATIO } from 'lib/math';
import { scaleLinear } from 'd3-scale';
import consts from 'consts';
import Color from 'ui/color';

import localForage from 'localforage';
import editorProto from 'proto/editor';

import EditorState from 'ui/EditorState';
import DefaultAttributes from 'ui/DefaultAttributes';

import EventEmitter from 'lib/events';
import Canvas from 'ui/canvas';
import Selection from 'ui/selection';
import { ELEMENTS, POINTS, PHANDLE, SHANDLE } from 'ui/selection';

import Posn from 'geometry/posn';
import Group from 'geometry/group';
import Index from 'geometry/index';
import Path from 'geometry/path';
import PathPoint from 'geometry/path-point';
import PointsSegment from 'geometry/points-segment';
import bool from 'lib/bool';

import Layer from 'io/layer';
import clipboard from 'io/clipboard';

import HistoryFrame from 'history/Frame';
import * as actions from 'history/actions/actions';

import Projection from 'ui/projection';
import HotkeyTracking from 'ui/hotkeys';
import Bounds from 'geometry/bounds';
import Element from 'ui/element';
import CursorTracking from 'ui/cursor-tracking';
import CursorHandler from 'ui/cursor-handler';
import { TextEditHandler } from 'lib/text';

import * as tools from 'ui/tools/tools';

import RulersUIElement from 'ui/editor/rulers';
import TransformerUIElement from 'ui/editor/transformer';
import DocumentPointsUIElement from 'ui/editor/doc_pts';
import DocumentElemsUIElement from 'ui/editor/doc_elems';
import TextEditUIElement from 'ui/editor/text_edit';

const UTILS_WIDTH = 320 + 276 + 10;

export default class Editor extends EventEmitter {
  constructor() {
    super();

    window.$e = this; // DEBUGGING

    this.docs = {};

    this.initState();

    // Set up debounced copies
    this.cacheStateDebounced = _.debounce(this.cacheState.bind(this), 500);
  }

  mount(root) {
    if (root) {
      this.root = root;
      this.initCanvas();

      if (this.doc) {
        this.initDoc();
        this.fitToScreen();
      }
    }
  }

  async open(doc) {
    let id = doc.__id__;
    let isNew = false;

    if (this.docs[id] === undefined) {
      // New doc we haven't opened yet
      isNew = true;
      this.docs[id] = doc;
    }

    this.doc = doc;

    await this.loadState(doc);

    if (this.root) {
      this.initDoc();
    }

    this.trigger('change:doc');
  }

  save() {}

  initDoc() {
    this.calculateScales();
    this.refreshAll();
    this.trigger('change');
    this.trigger('change:doc');
  }

  initCanvas() {
    this.canvas = new Canvas(this.root);
    this.cursor = new CursorTracking(this.root);
    this.cursorHandler = new CursorHandler(this.cursor);

    // UIElements
    let uiElems = [
      new DocumentPointsUIElement(this, 'doc-pts'),
      new DocumentElemsUIElement(this, 'doc-elems'),
      new TextEditUIElement(this, 'text-edit'),
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
      this.refresh('tool');
      this.refresh('ui');
    });

    this.cursorHandler.on('mouseup', (e, cursor) => {
      if (e.propagateToTool) this.state.tool.handleMouseup(e, cursor);
      this.refresh('tool');
      this.refresh('ui');
    });

    this.cursorHandler.on('mousedown', (e, cursor) => {
      if (e.propagateToTool) this.state.tool.handleMousedown(e, cursor);
      this.refresh('tool');
      this.refresh('ui');
    });

    this.cursorHandler.on('click', (e, cursor) => {
      if (e.propagateToTool) this.state.tool.handleClick(e, cursor);
      this.refresh('tool');
      this.refresh('ui');
    });

    this.cursorHandler.on('doubleclick', (e, cursor) => {
      if (e.propagateToTool) this.state.tool.handleDoubleClick(e, cursor);
      this.refresh('tool');
      this.refresh('ui');
    });

    this.cursorHandler.on('drag:start', (e, cursor) => {
      if (e.propagateToTool) this.state.tool.handleDragStart(e, cursor);
      this.refresh('tool');
      this.refresh('ui');
    });

    this.cursorHandler.on('drag', (e, cursor) => {
      if (e.propagateToTool) this.state.tool.handleDrag(e, cursor);
      this.refresh('tool');
      this.refresh('ui');
    });

    this.cursorHandler.on('drag:stop', (e, cursor) => {
      if (e.propagateToTool) this.state.tool.handleDragStop(e, cursor);
      this.refresh('tool');
      this.refresh('ui');
    });

    this.cursorHandler.on('scroll:x', (e, cursor) => {
      let delta = e.deltaX;
      if (!this.canvas.owns(e.target)) return;

      let shouldZoom =
        (this.state.tool.id === 'zoom' && !e.altKey) ||
        (this.state.tool.id !== 'zoom' && e.altKey);

      if (shouldZoom) {
        // noop
      } else {
        this.nudge(this.projection.zInvert(delta), 0);
      }
    });

    this.cursorHandler.on('scroll:y', (e, cursor) => {
      let delta = e.deltaY;
      if (!this.canvas.owns(e.target)) return;

      let shouldZoom =
        (this.state.tool.id === 'zoom' && !e.altKey) ||
        (this.state.tool.id !== 'zoom' && e.altKey);

      if (shouldZoom) {
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
      this.commitFrame();
    });
    hotkeys.on('down', 'upArrow', () => {
      this.nudgeSelected(0, -1);
      this.commitFrame();
    });
    hotkeys.on('down', 'leftArrow', () => {
      this.nudgeSelected(-1, 0);
      this.commitFrame();
    });
    hotkeys.on('down', 'rightArrow', () => {
      this.nudgeSelected(1, 0);
      this.commitFrame();
    });
    hotkeys.on('down', 'shift-downArrow', () => {
      this.nudgeSelected(0, 10);
      this.commitFrame();
    });
    hotkeys.on('down', 'shift-rightArrow', () => {
      this.nudgeSelected(10, 0);
      this.commitFrame();
    });
    hotkeys.on('down', 'shift-upArrow', () => {
      this.nudgeSelected(0, -10);
      this.commitFrame();
    });
    hotkeys.on('down', 'shift-leftArrow', () => {
      this.nudgeSelected(-10, 0);
      this.commitFrame();
    });

    hotkeys.on('down', 'ctrl-shift-G', e => {
      e.preventDefault();
      this.ungroupSelection();
    });

    hotkeys.on('down', 'ctrl-G', e => {
      e.preventDefault();
      this.groupSelection();
    });

    hotkeys.on('down', 'ctrl-downArrow', e => {
      this.shiftSelected(-1);
    });
    hotkeys.on('down', 'ctrl-upArrow', e => {
      this.shiftSelected(1);
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
    hotkeys.on('down', 'M', () => {
      this.selectTool(new tools.Rect(this));
    });
    hotkeys.on('down', 'L', () => {
      this.selectTool(new tools.Ellipse(this));
    });
    hotkeys.on('down', 'T', () => {
      this.selectTool(new tools.Type(this));
    });
    hotkeys.on('down', 'I', () => {
      this.selectTool(new tools.Eyedropper(this));
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

    hotkeys.on('down', 'ctrl-I', e => {
      e.preventDefault();
      this.trigger('hotkey:import');
    });

    hotkeys.on('down', 'ctrl-O', e => {
      e.preventDefault();
      this.trigger('hotkey:open');
    });

    hotkeys.on('down', 'ctrl-E', e => {
      e.preventDefault();
      this.trigger('hotkey:export');
    });

    hotkeys.on('down', '1', () => {
      this.actualSize();
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

    document.addEventListener('copy', e => {
      this.copy(e);
    });
    document.addEventListener('paste', e => {
      this.paste(e);
    });

    this.canvas.on('resize', e => {
      this.calculateScales();
    });

    this.refreshAll();
  }

  refreshAll() {
    if (this.canvas) this.canvas.refreshAll();
  }

  refresh(...ids) {
    if (this.canvas) this.canvas.refresh(...ids);
  }

  initState() {
    this.state = EditorState.empty();
  }

  async loadState(doc) {
    console.time('loadState');
    let loaded = false;

    try {
      let store = localForage.createInstance({ name: 'editor:state' });
      let bytes = await store.getItem(doc.metadata.uri);

      if (bytes) {
        // We parse the protobuf message directly in here because we require both the doc and the editor
        this.state = editorProto.parseState(bytes, this, doc);
        loaded = true;
      }
    } catch (e) {
      console.error(e);
      // fall thru
    }

    if (!loaded) {
      // If we fail to load, fall back to a default state
      this.state = EditorState.forDoc(this, this.doc);
      this.fitToScreen();
    }

    // Has to be done for initialization reasons
    this.selectTool(this.state.tool);

    console.timeEnd('loadState');
    this.calculateScales();
    this.refreshAll();
  }

  cacheState() {
    console.time('cacheState');
    try {
      let bytes = editorProto.serializeState(this.state, this, this.doc);
      let store = localForage.createInstance({ name: 'editor:state' });
      store.setItem(this.doc.metadata.uri, bytes);
    } catch (e) {
      console.error(e);
    }
    console.timeEnd('cacheState');
  }

  setDefaultColor(which, color) {
    let s = this.state.attributes[which];
    if (!s.equal(color)) {
      this.state.attributes[which] = color;
      this.trigger('change');
      this.trigger('change:colors');
    }
  }

  setColor(which, color) {
    let frame;

    if (
      this.state.selection.length > 0 &&
      this.state.selection.type === ELEMENTS
    ) {
      // Undo current frame if we can to get original colors back
      this.doc.resetStage();

      frame = new HistoryFrame(
        [
          actions.SetAttributeAction.forItems(
            this.state.selection.items,
            which,
            color
          )
        ],
        'Change color'
      );

      this.stageFrame(frame);
    } else {
      this.trigger('change');
    }

    return frame;
  }

  setPosition(posn) {
    this.state.position = posn;
    if (this.canvas && this.doc) {
      this.calculateScales();
    }
    this.refreshAll();
    this.cacheStateDebounced();
  }

  nudge(x, y) {
    this.setPosition(this.state.position.nudge(x, y));
  }

  zoomIn(anchor = null) {
    this.setZoom(this.state.zoomLevel * 1.2, anchor);
  }

  zoomOut(anchor = null) {
    this.setZoom(this.state.zoomLevel * 0.8, anchor);
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

    this.refreshAll();
    this.cacheStateDebounced();
  }

  actualSize() {
    let center = this.doc.bounds.center();
    this.setPosition(center);

    let zl = 1.0;

    if (this.doc.media === 'print') {
      // Adjust zoom to match physical dimensions on screen
      let pxs = units.ppi() / 72;
      zl *= pxs;
    }

    this.setZoom(zl);
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
    this.selectItems([]);
  }

  selectAll() {
    this.selectItems(this.doc.filterAvailable(this.doc.elements));
  }

  setSelection(sel) {
    if (sel.type === undefined) debugger;

    let oldSelection = this.state.selection;

    this.state.selection = sel;

    window.$s = sel; // DEBUG

    if (!oldSelection.equal(this.state.selection)) {
      this.trigger('change');
      this.trigger('change:selection');
    }

    this.refreshAll();
  }

  selectItems(items) {
    this.setSelection(new Selection(this.doc, items));
  }

  narrowSelectionByAttr(key, value) {
    let sel = this.state.selection.withAttrValue(key, value);
    this.setSelection(sel);
  }

  selectPointHandle(point, which) {
    let selType = {
      sHandle: SHANDLE,
      pHandle: PHANDLE
    }[which];

    this.setSelection(new Selection(this.doc, [point], selType));
  }

  toggleInSelection(items) {
    let sel = this.state.selection.clone();
    for (let item of items) {
      if (!sel.contains(item)) {
        sel.push(item);
      } else {
        sel.remove(item);
      }
    }
    this.setSelection(sel);
  }

  setHovering(items) {
    let oldHovering = this.state.hovering;
    this.state.hovering = new Selection(this.doc, items);

    if (!oldHovering.equal(this.state.hovering)) {
      this.trigger('change');
      this.trigger('change:hovering');

      this.refresh('ui');
    }
  }

  getAttribute(type, key) {
    if (this.state.selection.empty || this.state.selection.type === POINTS) {
      return this.state.attributes[key];
    } else {
      return this.state.selection.getAttr(type, key);
    }
  }

  isSelected(item) {
    if (item instanceof Layer) {
      return this.state.layer === item;
    } else if (this.state.selection.type === PHANDLE) {
      return this.state.selection.items[0].pHandle === item;
    } else if (this.state.selection.type === SHANDLE) {
      return this.state.selection.items[0].sHandle === item;
    } else {
      return this.state.selection.contains(item);
    }
  }

  setCurrentLayer(layer) {
    this.state.layer = layer;

    this.refreshAll();

    // defer
    setTimeout(() => {
      this.trigger('change');
      this.trigger('change:layer');
    }, 1);
  }

  ensureSelectedLayer() {
    if (this.doc.layers.length === 0) {
      // No layer!
      let layer = this.createLayer();
      this.setCurrentLayer(layer);
    } else if (this.doc.layers.indexOf(this.state.layer) === -1) {
      // Layer was removed;
      this.setCurrentLayer(this.layers[0]);
    }
  }

  createLayer(id, children = []) {
    let layer = new Layer({
      id: id || 'layer' + this.doc.layers.length,
      children
    });

    let frame = new HistoryFrame(
      [actions.InsertAction.forItem(this.doc, layer)],
      'Create layer'
    );

    this.stageFrame(frame);
    this.commitFrame();

    return layer;
  }

  selectTool(tool) {
    if (tool.constructor !== this.state.tool.constructor) {
      this.state.lastTool = this.state.tool;
      this.state.tool.cleanup();
    }
    this.state.tool = tool;

    this.refreshAll();
    if (this.doc) {
      this.state.selection.clearCache();
    }
    this.trigger('change');
    this.trigger('change:tool');

    this.cacheStateDebounced();
  }

  deleteSelection() {
    if (this.state.selection.empty) {
      return;
    }

    let frame;
    // After deleting points and elements, we perform a cleanup step
    // to remove empty parents.
    let shouldCleanUp = true;

    switch (this.state.selection.type) {
      case ELEMENTS:
        // Simple when removing elements; remove them whole
        frame = new HistoryFrame(
          [
            new actions.RemoveAction({
              items: this.state.selection.map(item => {
                return { item, index: item.index };
              })
            })
          ],
          'Remove elements'
        );
        this.stageFrame(frame);
        break;
      case POINTS:
        // If we're removing points that's harder. We have to open and split
        // PointsSegments to handle this properly.
        let selection = this.state.selection.items;

        let as = [];

        for (let i = 0; i < selection.length; i++) {
          let point = selection[i];
          let index = point.index;

          let segmentIndex = index.parent;
          let segment = this.doc.getFromIndex(segmentIndex);
          let path = this.doc.getFromIndex(segmentIndex.parent);

          if (segment.closed) {
            // If we have a closed segment, we just remove the point and open it
            as.push(actions.RemoveAction.forItems([point]));
            as.push(
              new actions.ShiftSegmentAction({
                index: segmentIndex,
                n: index.last
              })
            );

            as.push(new actions.OpenSegmentAction({ index: segmentIndex }));
          } else if (point === segment.first || point === segment.last) {
            as.push(actions.RemoveAction.forItems([point]));
          } else {
            // If the segment is already open, we split it into two segments
            as.push(actions.RemoveAction.forItems([point]));
            as.push(actions.SplitPathAction.forPoint(this.doc, point));
          }
          frame = new HistoryFrame(as.slice(0), 'Remove points');
          this.stageFrame(frame);
        }
        break;
      case PHANDLE:
      case SHANDLE:
        let item = this.state.selection.items[0];

        // Delete control point
        frame = new HistoryFrame(
          [
            actions.RemoveHandleAction.forPoint(item, this.state.selection.type)
          ],
          'Remove control handle'
        );
        this.stageFrame(frame);
        shouldCleanUp = false;
        break;
    }

    this.selectItems([]);
    this.setHovering([]);

    if (shouldCleanUp) {
      this.cleanUpEmptyItems(frame.actions[0]);
    }
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
      let cleanUpAction = new actions.RemoveAction({
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
    if (this.state.selection.empty) {
      return;
    }

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
    let parent = this.state.layer;
    let nextIndex = parent.nextChildIndex();

    for (let item of elems) {
      items.push({ item, index: nextIndex });
      nextIndex = nextIndex.plus(1);
    }

    let action = new actions.InsertAction({ items });

    let frame = new HistoryFrame([action], 'Insert elements');

    this.stageFrame(frame);
    this.commitFrame();

    return frame;
  }

  changeAttribute(type, key, value, title) {
    if (!this.state.selection.empty && this.state.selection.type === ELEMENTS) {
      let frame = new HistoryFrame(
        [
          actions.SetAttributeAction.forItems(
            this.state.selection.ofType(type),
            key,
            value
          )
        ],
        title
      );

      this.stageFrame(frame);
      this.commitFrame();
    } else {
      this.state.attributes.set(key, value);
      this.trigger('change');
    }
  }

  selectFromIndexes(indexes) {
    let sel = indexes.map(index => {
      return this.doc.getFromIndex(index);
    });

    this.selectItems(sel);
  }

  refreshDrawing(layer, context) {
    if (this.doc) {
      this.doc.drawToCanvas(layer, context, this.projection);
    }
  }

  calculateScales() {
    let zl = this.state.zoomLevel;

    // Calculate scales
    let offsetLeft = (this.canvas.width - this.doc.width * zl) / 2;
    offsetLeft += (this.doc.width / 2 - this.state.position.x) * zl;
    let offsetTop = (this.canvas.height - this.doc.height * zl) / 2;
    offsetTop += (this.doc.height / 2 - this.state.position.y) * zl;

    // Account for windows on right side
    offsetLeft -= UTILS_WIDTH / 2;
    // Rulers
    offsetTop += 20 / 2;
    offsetLeft += 20 / 2;

    let x = scaleLinear()
      .domain([0, this.doc.width])
      .range([offsetLeft, offsetLeft + this.doc.width * zl]);

    let y = scaleLinear()
      .domain([0, this.doc.height])
      .range([offsetTop, offsetTop + this.doc.height * zl]);

    this.projection = new Projection(x, y, zl);

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
    if (this.state.selection.empty) return;

    let frame = new HistoryFrame([
      new actions.NudgeAction({
        indexes: this.state.selection.indexes,
        xd,
        yd
      })
    ]);

    this.stageFrame(frame);
  }

  nudgeHandle(index, handle, xd, yd) {
    if (this.state.selection.empty) {
      return;
    }

    let frame = new HistoryFrame([
      new actions.NudgeHandleAction({
        index,
        xd,
        yd,
        handle
      })
    ]);

    this.perform(frame);
  }

  scaleSelected(x, y, origin) {
    if (this.state.selection.empty) {
      return;
    }

    let frame = new HistoryFrame([
      new actions.ScaleAction({
        indexes: this.state.selection.indexes,
        x,
        y,
        origin
      })
    ]);

    this.stageFrame(frame);
  }

  flipSelected(axis) {
    let x = 1;
    let y = 1;
    let title;

    switch (axis) {
      case 'x':
        x = -1;
        title = 'Flip horizontally';
        break;
      case 'y':
        y = -1;
        title = 'Flip vertically';
        break;
    }

    let frame = new HistoryFrame(
      [
        new actions.ScaleAction({
          indexes: this.state.selection.indexes,
          x,
          y,
          origin: this.state.selection.center
        })
      ],
      title
    );

    this.stageFrame(frame);
    this.commitFrame();
  }

  rotateSelected(angle, origin) {
    if (this.state.selection.empty) {
      return;
    }

    let frame = new HistoryFrame([
      new actions.RotateAction({
        indexes: this.state.selection.indexes,
        angle,
        origin
      })
    ]);

    this.stageFrame(frame);
  }

  shiftSelected(delta) {
    let indexes = [];

    if (this.state.selection.empty) {
      indexes = [this.state.layer.index];
    } else {
      indexes = this.state.selection.indexes;
    }

    let indexesIdx = {};
    for (let index of indexes) {
      indexesIdx[index.toString()] = true;
    }

    let items = [];

    for (let index of indexes) {
      if (this.canShift(indexesIdx, index, delta)) {
        items.push({ index, delta });
      }
    }

    if (items.length > 0) {
      let frame = new HistoryFrame(
        [new actions.ShiftIndexAction({ items })],
        'Shift ' + (delta === 1 ? 'up' : 'down')
      );

      this.stageFrame(frame);
      this.commitFrame();
    }
  }

  booleanSelected(op) {
    let result = bool[op](this.state.selection.itemsSorted.reverse());

    let index = this.state.selection.indexes[0];

    let frame = new HistoryFrame(
      [
        new actions.RemoveAction({
          items: this.state.selection.map(item => {
            return { item, index: item.index };
          })
        }),
        new actions.InsertAction({
          items: [{ item: result, index }]
        })
      ],
      _.capitalize(op)
    );

    this.stageFrame(frame);
    this.commitFrame();
  }

  canShift(indexesIdx, index, delta) {
    switch (delta) {
      case -1:
        for (let i = index.last - 1; i >= 0; i--) {
          let otherIndex = index.parent.concat([i]);
          if (indexesIdx[otherIndex.toString()] === undefined) {
            return true;
          }
        }
        return false;
      case 1:
        let parent = this.doc.getFromIndex(index.parent);
        let cap = parent.children.length;
        for (let i = index.last + 1; i < cap; i++) {
          let otherIndex = index.parent.concat([i]);
          if (indexesIdx[otherIndex.toString()] === undefined) {
            return true;
          }
        }
        return false;
    }
  }

  editText(index, position) {
    let item = this.doc.getFromIndex(index);
    let handler = new TextEditHandler(item);

    handler.setCursorPosition(position, position);

    let oldValue = item.data.value;

    handler.on('change', (e, value) => {
      let frame = new HistoryFrame(
        [
          new actions.SetAttributeAction({
            key: 'value',
            items: [{ index: item.index, oldValue, value }]
          })
        ],
        'Change text'
      );

      this.stageFrame(frame);

      item.clearCache();
    });

    handler.on('blur', (e, value) => {
      //delete this.state.textEditHandler;
      //this.commitFrame();
    });

    handler.on('change:selection', (e, sel) => {
      this.refreshAll();
    });

    this.state.textEditHandler = handler;

    this.refreshAll();
    this.trigger('change');
  }

  finishEditingText() {
    let handler = this.state.textEditHandler;
    let finalValue = handler.item.data.value;

    if (finalValue === '') {
      // Delete instead

      let frame = new HistoryFrame([
        actions.RemoveAction.forItems([handler.item])
      ]);
      this.stageFrame(frame);
      this.commitFrame();
    } else if (finalValue === handler.originalValue) {
      if (!this.doc.history.head.committed) {
        // TODO maybe remove this method entirely if we never use it anywhere else.
        this.abandonFrame();
      }
    } else {
      this.commitFrame();
    }

    this.state.textEditHandler.finish();
    delete this.state.textEditHandler;
  }

  setDocDimens(width, height) {
    let frame = new HistoryFrame(
      [actions.SetDocDimensionsAction.forDoc(this.doc, width, height)],
      'Resize document'
    );

    this.stageFrame(frame);
    this.commitFrame();

    this.refreshAll();
    this.trigger('change');
  }

  setDocName(name) {
    let frame = new HistoryFrame(
      [actions.SetDocNameAction.forDoc(this.doc, name)],
      'Rename document'
    );

    this.stageFrame(frame);
    this.commitFrame();

    this.refreshAll();
    this.trigger('change');
  }

  stageFrame(frame) {
    this.doc.stageFrame(frame);

    this.state.selection.clearCache();
    this.refreshAll();
    this.trigger('change');
  }

  commitFrame(frame) {
    this.doc.commitFrame();
    this.trigger('change');
    this.trigger('history:step');
  }

  abandonFrame() {
    this.doc.abandonFrame();
    this.trigger('change');
  }

  // TODO remove
  perform(h) {
    this.doc.perform(h);
    this.state.selection.clearCache();
    this.refreshAll();
    this.trigger('change');
  }

  undo() {
    this.doc.undo();
    this.state.selection.clearCache();
    this.refreshAll();
    this.trigger('change');
    this.trigger('history:step');
  }

  redo() {
    this.doc.redo();
    this.state.selection.clearCache();
    this.refreshAll();
    this.trigger('change');
    this.trigger('history:step');
  }

  jumpToHistoryDepth(depth) {
    this.doc.jumpToHistoryDepth(depth);
    this.state.selection.clearCache();
    this.refreshAll();
    this.trigger('change');
    this.trigger('history:step');
  }

  cut(e) {
    this.state.clipboard = this.state.selection.items.map(e => {
      return e.clone();
    });
    this.deleteSelection();
    this.trigger('change');
  }

  async copy(e) {
    clipboard.write(this.state.selection.items);
    this.trigger('change');
  }

  async paste(e) {
    let items = await clipboard.read();
    if (items) {
      let frame = this.insertElements(items);
      let indexes = frame.actions[0].data.items.map(item => {
        return item.index;
      });
      this.selectFromIndexes(indexes);
      this.trigger('change');
    }
  }

  refreshTool(layer, context) {
    this.state.tool.refresh(layer, context);
  }
}
