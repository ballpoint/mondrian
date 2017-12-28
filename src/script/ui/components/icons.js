import cursor from 'icons/cursor.svg';
import subcursor from 'icons/subcursor.svg';
import ellipse from 'icons/ellipse.svg';
import rect from 'icons/rect.svg';
import zoom from 'icons/zoom.svg';
import pen from 'icons/pen.svg';
import type from 'icons/type.svg';
import eyedropper from 'icons/eyedropper.svg';
import todo from 'icons/todo.svg';

import undo from 'icons/undo.svg';
import redo from 'icons/redo.svg';

import visible from 'icons/visible.svg';
import invisible from 'icons/invisible.svg';
import locked from 'icons/locked.svg';
import unlocked from 'icons/unlocked.svg';
import del from 'icons/delete.svg';
import insert from 'icons/insert.svg';

import alignLeft from 'icons/align_left.svg';
import alignCenter from 'icons/align_center.svg';
import alignRight from 'icons/align_right.svg';

import valignTop from 'icons/valign_top.svg';
import valignCenter from 'icons/valign_center.svg';
import valignBottom from 'icons/valign_bottom.svg';

import linecapButt from 'icons/linecap_butt.svg';
import linecapSquare from 'icons/linecap_square.svg';
import linecapRound from 'icons/linecap_round.svg';

import linejoinMiter from 'icons/linejoin_miter.svg';
import linejoinBevel from 'icons/linejoin_bevel.svg';
import linejoinRound from 'icons/linejoin_round.svg';

import booleanUnite from 'icons/boolean_unite.svg';
import booleanIntersect from 'icons/boolean_intersect.svg';
import booleanSubtract from 'icons/boolean_subtract.svg';

const ICONS = {
  cursor,
  subcursor,
  ellipse,
  rect,
  zoom,
  pen,
  type,
  eyedropper,
  todo,

  undo,
  redo,

  visible,
  invisible,
  locked,
  unlocked,
  del,
  insert,

  alignLeft,
  alignCenter,
  alignRight,

  valignTop,
  valignCenter,
  valignBottom,

  linecapButt,
  linecapSquare,
  linecapRound,

  linejoinMiter,
  linejoinBevel,
  linejoinRound,

  booleanUnite,
  booleanIntersect,
  booleanSubtract
};

export default ICONS;

export function renderIcon(name, opts = {}) {
  let style = {};

  if (opts.width && opts.height) {
    style.width = opts.width;
    style.height = opts.height;
  }

  if (opts.padding) {
    style.padding = opts.padding;
    style.width += opts.padding * 2;
    style.height += opts.padding * 2;
  }

  return (
    <span
      className={classnames({
        icon: true,
        weak: opts.weak,
        selected: opts.selected,
        ['icon--' + name]: true,
        'icon--fill-dimens': opts.width && opts.height
      })}
      style={style}
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  );
}
