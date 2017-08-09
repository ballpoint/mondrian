import Posn from "geometry/posn";
import LineSegment from "geometry/line-segment";
import assert from "assert";

describe("LineSegment", function() {
  it("has an angle", done => {
    // North
    let l1 = new LineSegment(new Posn(0, 0), new Posn(0, -10));
    // East
    let l2 = new LineSegment(new Posn(0, 0), new Posn(10, 0));
    // South
    let l3 = new LineSegment(new Posn(0, 0), new Posn(0, 10));
    // West
    let l4 = new LineSegment(new Posn(0, 0), new Posn(-10, 0));

    // North West
    let l5 = new LineSegment(new Posn(0, 0), new Posn(5, -5));
    // South West
    let l6 = new LineSegment(new Posn(0, 0), new Posn(5, 5));
    // South East
    let l7 = new LineSegment(new Posn(0, 0), new Posn(-5, 5));
    // North East
    let l8 = new LineSegment(new Posn(0, 0), new Posn(-5, -5));

    let p20Deg = new Posn(0, -10).rotate(20, new Posn(0, 0));
    let l9 = new LineSegment(new Posn(0, 0), p20Deg);

    assert.equal(Infinity, l1.slope);
    assert.equal(0, l2.slope);
    assert.equal(-Infinity, l3.slope);
    assert.equal(0, l4.slope);

    assert.equal(1, l5.slope);
    assert.equal(-1, l6.slope);
    assert.equal(1, l7.slope);
    assert.equal(-1, l8.slope);

    assert.equal(0, l1.angle360);
    assert.equal(90, l2.angle360);
    assert.equal(180, l3.angle360);
    assert.equal(270, l4.angle360);

    assert.equal(45, l5.angle360);
    assert.equal(135, l6.angle360);
    assert.equal(225, l7.angle360);
    assert.equal(315, l8.angle360);

    assert.equal(20, Math.round(l9.angle360));

    done();
  });
});
