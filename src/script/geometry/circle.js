import Range from 'geometry/range'
import Bounds from 'geometry/bounds'

export default class Circle {
  constructor(center, radius) {
    this.center = center;
    this.radius = radius;
  }

  bounds() {
    return new Bounds(
      this.center.clone().nudge(-this.radius/2,-this.radius/2),
      this.center.clone().nudge(this.radius/2,this.radius/2),
    );
  }
}
