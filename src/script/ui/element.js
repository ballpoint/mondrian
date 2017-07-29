export default class Element {
  constructor(id, shape, handlers={}, opts={}) {
    this.id = id;
    this.shape = shape;
    this.handlers = handlers;
    this.opts = opts;
  }
}
