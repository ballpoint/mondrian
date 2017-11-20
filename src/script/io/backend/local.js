import localForage from 'localforage';
import schema from 'proto/schema';
import proto from 'proto/proto';

class LocalBackend {
  constructor() {
    this.store = localForage.createInstance({ name: 'documents' });
  }

  get id() {
    return 'local';
  }

  async load(path) {
    let id = path.split('-')[0];
    let bytes = await this.store.getItem(id);

    if (_.isNil(bytes)) {
      throw new Error('Document not found');
    }

    let doc = schema.document.Document.decode(bytes);
    doc = proto.parse(doc);

    console.log(`${bytes.length} bytes, ${doc.history.frames.length} frames`);

    return doc;
  }

  async save(doc, path) {
    let serialized = proto.serialize(doc);
    let bytes = serialized.$type.encode(serialized).finish();
    let id = path.split('-')[0];
    return await this.store.setItem(id, bytes);
  }

  async list() {
    return await this.store.keys();
  }
}

export default new LocalBackend();
