import EventEmitter from 'lib/events';
// Util for measuring text with a throwaway canvas element

let canvas;
let context;

export function measure(value, style) {
  if (canvas === undefined) {
    canvas = document.createElement('canvas');
    context = canvas.getContext('2d');
  }

  context.font = style;
  return context.measureText(value);
}

export class TextEditHandler extends EventEmitter {
  // Spawns offscreen textarea and fires change events when edited
  constructor(item) {
    super();

    this.item = item;
    this.originalValue = item.data.value;
    let textarea = document.createElement('textarea');
    this.textarea = textarea;

    textarea.innerHTML = item.data.value;

    document.querySelector('body').appendChild(textarea);

    textarea.onblur = e => {
      e.stopPropagation();
      this.trigger('blur', e, textarea.value);
    };

    textarea.oninput = e => {
      e.stopPropagation();
      this.trigger('change', e, textarea.value);
    };

    textarea.onpaste = e => {
      e.stopPropagation();
      this.trigger('change', e, textarea.value);
    };

    this.trigger('change', null, textarea.value);

    textarea.style.width = item.data.width + 'px';
    textarea.style.height = item.data.height + 'px';
    textarea.style.overflow = 'hidden';
    textarea.style.fontFamily = item.fontFamily();
    textarea.style.fontSize = item.fontSize();
    textarea.style.position = 'absolute';
    textarea.style.left = '-10000px';
    textarea.style.top = '-10000px';
    textarea.setAttribute('data-keepfocus', 'true');

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

  setCursorPosition(start, end) {
    this.textarea.focus();
    this.textarea.selectionStart = start;
    this.textarea.selectionEnd = end;
    this.selectionHandler();
  }

  finish() {
    document.querySelector('body').removeChild(this.textarea);
  }
}
