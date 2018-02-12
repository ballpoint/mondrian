// Collection of views for renderer

import IndexView from 'ui/components/views/IndexView/index';
import EditorView from 'ui/components/views/EditorView/index';
import AboutView from 'ui/components/views/AboutView/index';

window.__VIEWS__ = {
  editor: EditorView,
  index: IndexView,
  about: AboutView
};

export default __VIEWS__;
