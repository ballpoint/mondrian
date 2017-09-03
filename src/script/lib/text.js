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

    textarea.style.width = '1000px';
    textarea.style.height = '1000px';
    textarea.style.fontFamily = item.fontFamily();
    textarea.style.position = 'absolute';
    textarea.style.left = '-10000px';
    textarea.style.top = '-10000px';

    this.selectionHandler = e => {
      this.selection = {
        start: textarea.selectionStart,
        end: textarea.selectionEnd
      };
      this.trigger('change:selection', e, this.selection);
    };

    textarea.addEventListener('keydown', this.selectionHandler);
    textarea.addEventListener('keyup', this.selectionHandler);
    textarea.addEventListener('input', this.selectionHandler);
  }

  setCursorPosition(position) {
    this.textarea.focus();
    this.textarea.selectionStart = position;
    this.textarea.selectionEnd = position;

    this.selectionHandler();
  }
}
