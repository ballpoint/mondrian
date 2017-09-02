import EventEmitter from 'lib/events';
// Util for measuring text with a throwaway canvas element

let canvas = document.createElement('canvas');
let context = canvas.getContext('2d');

export function measure(value, style) {
  context.font = style;
  return context.measureText(value);
}

export class TextEditHandler extends EventEmitter {
  // Spawns offscreen textarea and fires change events when edited
  constructor(item) {
    super();

    this.item = item;
    let textarea = document.createElement('textarea');
    this.textarea = textarea;

    textarea.innerHTML = item.data.value;

    document.querySelector('body').appendChild(textarea);

    textarea.onblur = e => {
      e.stopPropagation();
      this.trigger('blur', e, textarea.value);

      document.querySelector('body').removeChild(textarea);
    };

    textarea.oninput = e => {
      e.stopPropagation();
      this.trigger('change', e, textarea.value);
    };

    let selectionHandler = e => {
      console.log(e);
      this.selection = {
        start: textarea.selectionStart,
        end: textarea.selectionEnd
      };
      this.trigger('change:selection', e, this.selection);
    };

    textarea.addEventListener('keydown', selectionHandler);
    textarea.addEventListener('keyup', selectionHandler);
    textarea.addEventListener('input', selectionHandler);
  }

  setCursorPosition(position) {
    this.textarea.focus();
    this.textarea.selectionStart = position;
    this.textarea.selectionEnd = position;
  }
}
