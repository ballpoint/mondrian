import classnames from 'classnames';
import cursor from 'icons/cursor.svg';
import ellipse from 'icons/ellipse.svg';
import rect from 'icons/rect.svg';
import zoom from 'icons/zoom.svg';
import pen from 'icons/pen.svg';
import type from 'icons/type.svg';
import todo from 'icons/todo.svg';

import undo from 'icons/undo.svg';
import redo from 'icons/redo.svg';

import visible from 'icons/visible.svg';
import invisible from 'icons/invisible.svg';
import locked from 'icons/locked.svg';
import unlocked from 'icons/unlocked.svg';
import del from 'icons/delete.svg';

import alignLeft from 'icons/align_left.svg';
import alignCenter from 'icons/align_center.svg';
import alignRight from 'icons/align_right.svg';

import valignTop from 'icons/valign_top.svg';
import valignCenter from 'icons/valign_center.svg';
import valignBottom from 'icons/valign_bottom.svg';

const ICONS = {
  cursor,
  ellipse,
  rect,
  zoom,
  pen,
  type,
  todo,

  undo,
  redo,

  visible,
  invisible,
  locked,
  unlocked,
  del,

  alignLeft,
  alignCenter,
  alignRight,

  valignTop,
  valignCenter,
  valignBottom
};

export default ICONS;

export function renderIcon(name, opts={}) {
  return (
    <span className={classnames({
      "icon": true,
      "weak": opts.weak,

    })} dangerouslySetInnerHTML={{ __html: ICONS[name] }} />
  );
}
