import Group from 'geometry/group';

export default class Layer {
  constructor(attrs) {
    this.id = attrs.id;
    this.children = attrs.children;
  }

  get childrenFlat() {
    
  }

  remove(elem) {
    this.children = this.children.filter((existing) => { return existing !== elem });
  }

  get childrenFlat() {
    let cf = [];
    for (let child of this.children) {
      if (child instanceof Group) {
        cf = cf.concat(child.childrenFlat);
      } else {
        cf.push(child);
      }
    }

    return cf;
  }

  child(i) {
    return this.children[i];
  }

  insert(child, i) {
    this.children = this.children.insertAt(child, i);
  }

  get empty() {
    return this.children.length === 0;
  }
}
