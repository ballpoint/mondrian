import Cursor from 'ui/tools/cursor';
import SubCursor from 'ui/tools/subcursor';
import Zoom from 'ui/tools/zoom';
import Pen from 'ui/tools/pen';
import Rect from 'ui/tools/rect';
import Ellipse from 'ui/tools/ellipse';
import Paw from 'ui/tools/paw';
import Type from 'ui/tools/type';
import Eyedropper from 'ui/tools/eyedropper';

export { Cursor, SubCursor, Zoom, Pen, Rect, Ellipse, Paw, Type, Eyedropper };

export let mapping = {
  cursor: Cursor,
  subcursor: SubCursor,
  zoom: Zoom,
  pen: Pen,
  rect: Rect,
  ellipse: Ellipse,
  paw: Paw,
  type: Type,
  eyedropper: Eyedropper
};
