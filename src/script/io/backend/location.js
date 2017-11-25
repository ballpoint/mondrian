export default class DocMetadata {
  constructor(attrs) {
    this.backend = attrs.backend;
    this.name = attrs.name;
    this.path = attrs.path;
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
