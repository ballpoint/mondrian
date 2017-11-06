import localForage from 'localforage';
import schema from 'proto/schema';
import proto from 'proto/proto';

class LocalBackend {
  constructor() {}

  async load(path) {
    let id = path.split('-')[0];
    let bytes = await localForage.getItem(id);
    let doc = schema.document.Document.decode(bytes);
    doc = proto.parse(doc);
    return doc;
  }

  async save(doc, path) {
    let serialized = proto.serialize(doc);
    let bytes = serialized.$type.encode(serialized).finish();

    let id = path.split('-')[0];

    console.log(id, 'saved');

    return await localForage.setItem(id, bytes);
  }
}

export default new LocalBackend();
