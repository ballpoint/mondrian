import HotkeyTracking from 'ui/hotkeys';
import * as tools from 'ui/tools/tools';

function initEditorHotkeys(editor) {
  let hotkeys = new HotkeyTracking();

  hotkeys.on('down', 'downArrow', () => {
    editor.nudgeSelected(0, 1);
    editor.commitFrame();
  });
  hotkeys.on('down', 'upArrow', () => {
    editor.nudgeSelected(0, -1);
    editor.commitFrame();
  });
  hotkeys.on('down', 'leftArrow', () => {
    editor.nudgeSelected(-1, 0);
    editor.commitFrame();
  });
  hotkeys.on('down', 'rightArrow', () => {
    editor.nudgeSelected(1, 0);
    editor.commitFrame();
  });
  hotkeys.on('down', 'shift-downArrow', () => {
    editor.nudgeSelected(0, 10);
    editor.commitFrame();
  });
  hotkeys.on('down', 'shift-rightArrow', () => {
    editor.nudgeSelected(10, 0);
    editor.commitFrame();
  });
  hotkeys.on('down', 'shift-upArrow', () => {
    editor.nudgeSelected(0, -10);
    editor.commitFrame();
  });
  hotkeys.on('down', 'shift-leftArrow', () => {
    editor.nudgeSelected(-10, 0);
    editor.commitFrame();
  });

  hotkeys.on('down', 'ctrl-shift-G', e => {
    e.preventDefault();
    editor.ungroupSelection();
  });

  hotkeys.on('down', 'ctrl-G', e => {
    e.preventDefault();
    editor.groupSelection();
  });

  hotkeys.on('down', 'ctrl-downArrow', e => {
    editor.shiftSelected(-1);
  });
  hotkeys.on('down', 'ctrl-upArrow', e => {
    editor.shiftSelected(1);
  });

  hotkeys.on('down', 'V', () => {
    editor.selectTool(new tools.Cursor(editor));
  });
  hotkeys.on('down', 'A', () => {
    editor.selectTool(new tools.SubCursor(editor));
  });
  hotkeys.on('down', 'Z', () => {
    editor.selectTool(new tools.Zoom(editor));
  });
  hotkeys.on('down', 'P', () => {
    editor.selectTool(new tools.Pen(editor));
  });
  hotkeys.on('down', 'M', () => {
    editor.selectTool(new tools.Rect(editor));
  });
  hotkeys.on('down', 'L', () => {
    editor.selectTool(new tools.Ellipse(editor));
  });
  hotkeys.on('down', 'T', () => {
    editor.selectTool(new tools.Type(editor));
  });
  hotkeys.on('down', 'I', () => {
    editor.selectTool(new tools.Eyedropper(editor));
  });
  hotkeys.on('down', 'space', () => {
    editor.selectTool(new tools.Paw(editor));
  });
  hotkeys.on('up', 'space', () => {
    editor.selectTool(editor.state.lastTool);
  });

  hotkeys.on('down', 'ctrl-A', e => {
    e.preventDefault();
    editor.selectAll();
  });

  hotkeys.on('down', 'ctrl-I', e => {
    e.preventDefault();
    editor.trigger('hotkey:import');
  });

  hotkeys.on('down', 'ctrl-O', e => {
    e.preventDefault();
    editor.trigger('hotkey:open');
  });

  hotkeys.on('down', 'ctrl-E', e => {
    e.preventDefault();
    editor.trigger('hotkey:export');
  });

  hotkeys.on('down', '1', () => {
    editor.actualSize();
  });
  hotkeys.on('down', '0', () => {
    editor.fitToScreen();
  });

  hotkeys.on('down', '+', () => {
    editor.zoomIn();
  });
  hotkeys.on('down', '-', () => {
    editor.zoomOut();
  });

  hotkeys.on('down', 'backspace', () => {
    editor.deleteSelection();
  });

  hotkeys.on('down', 'ctrl-Z', e => {
    e.preventDefault();
    editor.undo();
  });
  hotkeys.on('down', 'ctrl-shift-Z', e => {
    e.preventDefault();
    editor.redo();
  });

  document.addEventListener('copy', e => {
    editor.copy(e);
  });
  document.addEventListener('paste', e => {
    editor.paste(e);
  });
}

export default initEditorHotkeys;
