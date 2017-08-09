import Item from "geometry/item";

/*



 */

class Tspan extends Item {
  static initClass() {
    this.prototype.type = "tspan";
  }

  constructor(data) {
    this.data = data;
  }
}
Tspan.initClass();
