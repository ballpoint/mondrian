export default class DocMetadata {
  constructor(attrs) {
    this.backend = attrs.backend;
    this.name = attrs.name;
    this.path = attrs.path;
    this.width = attrs.width;
    this.height = attrs.height;
    this.thumb = attrs.thumb;
    // Timestamps
    this.created = attrs.created;
    this.modified = attrs.modified;
  }

  save(doc) {
    this.backend.save(doc, this.path);
  }

  get uri() {
    return `/files/${this.backend.id}/${this.path}`;
  }
}
