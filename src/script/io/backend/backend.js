import LocalBackend from 'io/backend/local';
import DocMetadata from 'io/backend/metadata';
import Doc from 'io/doc';

const backend = {
  async parseDocFromURL() {
    let parts = window.location.pathname.split('/').filter(part => {
      return part !== '';
    });

    if (parts.length <= 1) {
      return this.newDoc();
    }

    let backend = parts[1];
    let path = parts.slice(2).join('/');

    if (path === 'new') {
      // Create new file
      return this.newDoc();
    }

    backend = {
      local: LocalBackend
    }[backend];

    window.backend = backend;

    let loc = new DocMetadata({ backend, path });
    let doc = await loc.backend.load(loc.path);

    doc.location = loc;

    return doc;
  },

  newDoc() {
    let doc = Doc.empty(600, 400, 'untitled');
    doc.location = LocalBackend.assign(doc);
    LocalBackend.save(doc);
    return doc;
  },

  replaceLocation(doc) {
    history.replaceState({}, doc.name, doc.location.uri);
  }
};

export default backend;
