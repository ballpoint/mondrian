import LocalBackend from 'io/backend/local';

import { DocLocation } from 'io/doc';

const backend = {
  parseLocation() {
    let parts = window.location.pathname.split('/').filter(part => {
      return part !== '';
    });

    let backend = parts[1];
    let path = parts.slice(2).join('/');

    backend = {
      local: LocalBackend
    }[backend];

    return new DocLocation({ backend, path });
  },

  replaceLocation(doc) {
    history.replaceState({}, doc.name, doc.location.path);
  },

  loadFromURL() {}
};

export default backend;
