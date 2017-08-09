import Posn from 'geometry/posn';
import assert from 'assert';

describe('Posn', function() {
  it('nudges', done => {
    let p = new Posn(0, 0);

    assert.equal(0, p.x);
    assert.equal(0, p.y);

    p.nudge(10, -15.6);

    assert.equal(10, p.x);
    assert.equal(-15.6, p.y);

    done();
  });
});
