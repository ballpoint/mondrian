import Posn from 'geometry/posn';
import Bounds from 'geometry/bounds';
import assert from 'assert';

describe("Bounds", function() {
  it('can move its edges across each other', (done) => {
    let bounds = new Bounds(0, 0, 10, 10);
    assert.equal(bounds.width, 10);

    bounds.moveEdge('l', 5);
    assert.equal(bounds.width, 5);

    bounds.moveEdge('l', 4.9);
    assert.equal(bounds.width.toFixed(1), 0.1);
    assert.equal(bounds.x, bounds.l);
    assert.equal(bounds.x2, bounds.r);

    bounds.moveEdge('l', 0.3);
    assert.equal(bounds.width.toFixed(1), 0.2);
    assert.equal(bounds.x, bounds.r);
    assert.equal(bounds.x2, bounds.l);

    bounds.moveEdge('l', 1.0);
    assert.equal(bounds.width.toFixed(1), 0.8);
    assert.equal(bounds.x, bounds.l);
    assert.equal(bounds.x2, bounds.r);

    done();
  });
});

