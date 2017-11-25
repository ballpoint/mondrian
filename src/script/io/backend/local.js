import shortid from 'shortid';
import localForage from 'localforage';
import schema from 'proto/schema';
import proto from 'proto/proto';
import DocMetadata from 'io/backend/metadata';

class LocalBackend {
  constructor() {
    this.store = localForage.createInstance({ name: 'documents' });
    this.metadataStore = localForage.createInstance({
      name: 'documents:metadata'
    });
  }

  get id() {
    return 'local';
  }

  assign(doc) {
    let id = shortid.generate();

    return new DocMetadata({
      path: id,
      backend: this,
      name: doc.name,
      created: new Date()
    });
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
    console.trace();
    let serialized = proto.serialize(doc);
    let bytes = serialized.$type.encode(serialized).finish();
    let id = path.split('-')[0];

    console.log(doc.width, doc.height);

    await this.metadataStore.setItem(id, {
      id,
      name: doc.name,
      modified: new Date(),
      width: doc.width,
      height: doc.height
    });

    return await this.store.setItem(id, bytes);
  }

  async list() {
    let locs = [];
    let ids = await this.metadataStore.keys();

    for (let id of ids) {
      let metadata = await this.metadataStore.getItem(id);
      locs.push(
        new DocMetadata({
          backend: this,
          path: id,
          name: metadata.name,
          modified: metadata.modified,
          width: metadata.width,
          height: metadata.height
        })
      );
    }

    return locs;
  }
}

export default new LocalBackend();
