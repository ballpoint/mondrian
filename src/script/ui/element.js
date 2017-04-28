export default class Element {
  constructor(id, shape, handlers={}) {
    this.id = id;
    this.shape = shape;
    this.handlers = handlers;
  }
}
