import Posn from 'geometry/posn';
import PathPoint from 'geometry/path-point';
import Index from 'geometry/index';
import Doc from 'io/doc';

import proto from 'proto/proto';
import assert from 'assert';

import googleSVG from 'google.svg';

import * as actions from 'history/actions/actions';

function roundTripProto(value) {
  let serialized = proto.serialize(value);
  let bytes = serialized.$type.encode(serialized).finish();
  let message = serialized.$type.decode(bytes);
  return proto.parse(message);
}

function testRoundTrip(value) {
  assert.deepEqual(value, roundTripProto(value));
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

  it('roundtrip: Document', done => {
    let doc = Doc.fromSVG(googleSVG, 'google.svg');
    let docOut = roundTripProto(doc);
    done();
  });

  it('actions: NudgeAction ', done => {
    testRoundTrip(
      new actions.NudgeAction({
        indexes: [new Index([0, 3, 4])],
        xd: 10,
        yd: 20
      })
    );

    done();
  });

  it('actions: ScaleAction ', done => {
    testRoundTrip(
      new actions.ScaleAction({
        indexes: [new Index([0, 3, 4])],
        xs: 2.02,
        ys: 1.4
      })
    );

    done();
  });

  it('actions: RotateAction ', done => {
    testRoundTrip(
      new actions.RotateAction({
        indexes: [new Index([0, 3, 4])],
        angle: 12.2
      })
    );

    done();
  });

  it('actions: NudgeHandleAction ', done => {
    testRoundTrip(
      new actions.NudgeHandleAction({
        index: new Index([0, 2]),
        handle: 'pHandle',
        xd: 20,
        yd: 10
      })
    );

    testRoundTrip(
      new actions.NudgeHandleAction({
        index: new Index([1, 4]),
        handle: 'sHandle',
        xd: 20,
        yd: 100
      })
    );

    done();
  });

  it('actions: AddHandleAction  ', done => {
    testRoundTrip(
      new actions.AddHandleAction({
        index: new Index([1, 4]),
        handle: 'sHandle',
        reflect: true
      })
    );

    done();
  });

  it('actions: RemoveHandleAction  ', done => {
    testRoundTrip(
      new actions.RemoveHandleAction({
        index: new Index([1, 4]),
        handle: 'sHandle',
        reflect: true
      })
    );

    done();
  });
});
