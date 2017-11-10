import LocalBackend from 'io/backend/local';
import Doc from 'io/doc';

export class DocLocation {
  constructor(attrs) {
    this.backend = attrs.backend;
    this.path = attrs.path;
  }

  static defaultLocal(doc) {
    return new DocLocation({
      backend: LocalBackend,
      path: doc.__id__
    });
  }

  save(doc) {
    this.backend.save(doc, this.path);
  }

  get uri() {
    return `/files/${this.backend.id}/${this.path}`;
  }
}

const backend = {
  async parseDocFromURL() {
    let parts = window.location.pathname.split('/').filter(part => {
      return part !== '';
    });

    console.log(parts);

    if (parts.length <= 1) {
      return this.newDoc();
    }

    let backend = parts[1];
    let path = parts.slice(2).join('/');

    backend = {
      local: LocalBackend
    }[backend];

    let loc = new DocLocation({ backend, path });
    let doc = await loc.backend.load(loc.path);

    doc.location = loc;

    return doc;
  },

  newDoc() {
    let doc = Doc.empty(600, 400, 'untitled');
    doc.location = DocLocation.defaultLocal(doc);
    return doc;
  },

  replaceLocation(doc) {
    history.replaceState({}, doc.name, doc.location.uri);
  }
};

export default backend;
