// Collection of views for renderer

import IndexView from 'ui/components/views/IndexView/index';
import EditorView from 'ui/components/views/EditorView/index';

window.__VIEWS__ = {
  editor: EditorView,
  index: IndexView
};

export default __VIEWS__;
