import shortid from 'shortid';
import localForage from 'localforage';
import schema from 'proto/schema';
import proto from 'proto/proto';
import DocMetadata from 'io/backend/metadata';
import Thumb from 'ui/thumb';

class LocalBackend {
  constructor() {
    this.store = localForage.createInstance({ name: 'documents' });

    this.thumbStore = localForage.createInstance({
      name: 'documents:thumbnails'
    });

    this.metadataStore = localForage.createInstance({
      name: 'documents:metadata'
    });

    window.clearFiles = () => {
      this.store.clear();
      this.thumbStore.clear();
      this.metadataStore.clear();
    };
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
    console.time('Save ' + path);

    let serialized = proto.serialize(doc);
    let bytes = serialized.$type.encode(serialized).finish();
    let id = path.split('-')[0];

    // Save metadata

    await this.metadataStore.setItem(id, {
      id,
      name: doc.name,
      modified: new Date(),
      width: doc.width,
      height: doc.height
    });

    // Save doc thumbnail

    let thumbBounds = doc.bounds.fitToDimensions(2000, 280);
    let thumb = new Thumb([doc], {
      maxWidth: thumbBounds.width,
      maxHeight: thumbBounds.height
    });
    let blob = await thumb.drawAndFetchRaw(
      thumbBounds.width,
      thumbBounds.height
    );
    console.log(id, blob);
    this.thumbStore.setItem(id, blob);

    // Save doc source

    console.timeEnd('Save ' + path);
    return await this.store.setItem(id, bytes);
  }

  async destroy(path) {
    this.store.removeItem(path);
    this.metadataStore.removeItem(path);
    this.thumbStore.removeItem(path);
  }

  async list() {
    let locs = [];
    let ids = await this.metadataStore.keys();

    for (let id of ids) {
      let metadata = await this.metadataStore.getItem(id);

      let thumbURI;
      let thumb = await this.thumbStore.getItem(id);
      if (thumb) {
        thumbURI = window.URL.createObjectURL(thumb);
      }

      locs.push(
        new DocMetadata({
          backend: this,
          path: id,
          name: metadata.name,
          modified: metadata.modified,
          width: metadata.width,
          height: metadata.height,
          thumb: thumbURI
        })
      );
    }

    locs = locs.sort((a, b) => {
      return b.modified.valueOf() - a.modified.valueOf();
    });

    return locs;
  }
}

export default new LocalBackend();
