import schemas from 'proto_schemas.json';

let root = new protobuf.Root.fromJSON(schemas);

window.proot = root;

export default {
  geometry: root.lookup('geometry'),
  history: root.lookup('history'),
  document: root.lookup('document'),
  editor: root.lookup('editor')
};
