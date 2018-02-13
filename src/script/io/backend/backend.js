import LocalBackend from 'io/backend/local';
import ExamplesBackend from 'io/backend/examples';
import localForage from 'localforage';
import DocMetadata from 'io/backend/metadata';
import Doc from 'io/doc';

const backend = {
  parseParamsFromURL() {
    let parts = window.location.pathname.split('/').filter(part => {
      return part !== '';
    });

    let backend, path;

    if (parts.length > 2) {
      backend = parts[1];
      path = parts.slice(2).join('/');
    }

    return {
      backend,
      path
    };
  },

  async loadFromParams(backend, path) {
    backend = {
      local: LocalBackend,
      examples: ExamplesBackend
    }[backend];

    let meta = new DocMetadata({ backend, path });
    let doc = await meta.backend.load(meta.path);

    if (!doc.metadata) doc.metadata = meta;

    return doc;
  },

  async loadLastModifiedDoc() {
    // Root path
    let metas = await LocalBackend.list();
    if (metas.length === 0) {
      return await this.newDoc();
    } else {
      try {
        let latest = metas[0];
        let doc = await LocalBackend.load(latest.path);
        doc.metadata = latest;
        return doc;
      } catch (e) {
        // Fall back to fresh doc
        return await this.newDoc();
      }
    }
  },

  async newDoc(params) {
    let store = localForage.createInstance({ name: 'local' });

    if (!params) {
      params = await store.getItem('newDocumentParams');

      if (!params) {
        params = {
          media: 'digital',
          width: 600,
          height: 400,
          unit: 'px'
        };
      }
    }

    let doc = Doc.empty(
      params.media,
      params.unit,
      params.width,
      params.height,
      'untitled'
    );
    doc.metadata = LocalBackend.assign(doc);
    doc.save();
    return doc;
  },

  replaceLocation(doc) {
    history.replaceState({}, doc.name, doc.metadata.uri);
  }
};

export default backend;
