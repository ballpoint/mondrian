import Posn from 'geometry/posn';
import PathPoint from 'geometry/path-point';
import proto from 'proto/proto';
import assert from 'assert';

function testRoundTrip(value) {
  let serialized = proto.serialize(value);
  let parsed = proto.parse(serialized);
  assert.deepStrictEqual(value, parsed);
}

describe('Proto', function() {
  it('roundtrip: Posn', done => {
    testRoundTrip(new Posn(10, 20));
    done();
  });

  it('roundtrip: PathPoint with no handles', done => {
    testRoundTrip(new PathPoint(10, 20));

    testRoundTrip(new PathPoint(10, 20, 30, 40));
    testRoundTrip(new PathPoint(10, 20, null, null, 30, 40));

    done();
  });
});
