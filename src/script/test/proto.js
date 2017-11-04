import Posn from 'geometry/posn';
import PathPoint from 'geometry/path-point';
import Index from 'geometry/index';
import proto from 'proto/proto';
import assert from 'assert';

function testRoundTrip(value) {
  let serialized = proto.serialize(value);
  let bytes = serialized.$type.encode(serialized).finish();
  let message = serialized.$type.decode(bytes);
  let parsed = proto.parse(message);
  assert.deepStrictEqual(value, parsed);
}

describe('Proto', function() {
  it('roundtrip: Posn', done => {
    testRoundTrip(new Posn(10, 20));
    done();
  });

  it('roundtrip: PathPoint', done => {
    testRoundTrip(new PathPoint(10, 20));

    testRoundTrip(new PathPoint(10, 20, 30, 40));
    testRoundTrip(new PathPoint(10, 20, null, null, 30, 40));

    done();
  });

  it('roundtrip: Index', done => {
    testRoundTrip(new Index([0, 1, 5, 6, 1, 0]));
    done();
  });
});
