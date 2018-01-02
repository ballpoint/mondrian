import LocalBackend from 'io/backend/local';
import DocMetadata from 'io/backend/metadata';
import Doc from 'io/doc';

const backend = {
  async parseDocFromURL() {
    let parts = window.location.pathname.split('/').filter(part => {
      return part !== '';
    });

    if (parts.length <= 1) {
      // Root path
      let metas = await LocalBackend.list();
      if (metas.length === 0) {
        return await this.newDoc();
      } else {
        let latest = metas[0];
        let doc = await LocalBackend.load(latest.path);
        doc.metadata = latest;
        return doc;
      }
    }

    let backend = parts[1];
    let path = parts.slice(2).join('/');

    if (path === 'new') {
      // Create new file
      return await this.newDoc();
    }

    backend = {
      local: LocalBackend
    }[backend];

    let meta = new DocMetadata({ backend, path });
    let doc = await meta.backend.load(meta.path);

    doc.metadata = meta;

    return doc;
  },

  async newDoc() {
    let store = localForage.createInstance({ name: 'local' });

    let params = await store.getItem('newDocumentParams');

    if (!params) {
      params = {
        media: 'digital',
        width: 600,
        height: 400,
        unit: 'px'
      };
    }

    let doc = Doc.empty(600, 400, 'untitled');
    doc.metadata = LocalBackend.assign(doc);
    doc.save();
    return doc;
  },

  replaceLocation(doc) {
    history.replaceState({}, doc.name, doc.metadata.uri);
  }
};

export default backend;
