import Posn from 'geometry/posn';
import PathPoint from 'geometry/path-point';
import Index from 'geometry/index';
import Text from 'geometry/text';
import Doc from 'io/doc';
import svg from 'io/formats/svg';

import proto from 'proto/proto';
import schema from 'proto/schema';
import assert from 'assert';

import googleSVG from 'google.svg';

import * as actions from 'history/actions/actions';

function roundTrip(value) {
  let serialized = proto.serialize(value);
  let bytes = serialized.$type.encode(serialized).finish();
  let message = serialized.$type.decode(bytes);
  let parsed = proto.parse(message);

  return parsed;
}

function roundTripItem(value) {
  let serialized = proto.serializeItem(value);
  let bytes = schema.document.Item.encode(serialized).finish();
  let message = schema.document.Item.decode(bytes);
  let parsed = proto.parseItem(message);

  return parsed;
}

function testRoundTrip(value) {
  assert.deepEqual(value, roundTrip(value));
}

function testRoundTripItem(value) {
  assert.deepEqual(value, roundTripItem(value));
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

  it('roundtrip: Color', done => {
    testRoundTrip(new Color(100, 100, 200, 0.5));
    testRoundTrip(new Color(null));
    done();
  });

  it('roundtrip: Index', done => {
    testRoundTrip(new Index([0, 1, 5, 6, 1, 0]));
    done();
  });

  it('roundtrip: Document', done => {
    let doc = svg.parse(googleSVG, 'google.svg');
    roundTrip(doc);
    done();
  });

  it('roundtrip: Text', done => {
    let text = new Text({
      x: 10,
      y: 20,
      width: 200,
      height: 400,
      value: 'lol hello'
    });

    roundTripItem(text);
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
        x: 2.02,
        y: 1.4,
        origin: new Posn(20, 20)
      })
    );

    done();
  });

  it('actions: RotateAction ', done => {
    testRoundTrip(
      new actions.RotateAction({
        indexes: [new Index([0, 3, 4])],
        angle: 12.2,
        origin: new Posn(20, 20)
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

  it('actions: AddHandleAction', done => {
    testRoundTrip(
      new actions.AddHandleAction({
        index: new Index([1, 4]),
        handle: 'sHandle',
        posn: new Posn(20, 90.2),
        reflect: true
      })
    );

    done();
  });

  it('actions: RemoveHandleAction', done => {
    testRoundTrip(
      new actions.RemoveHandleAction({
        index: new Index([1, 4]),
        handle: 'sHandle',
        reflect: true
      })
    );

    done();
  });

  it('actions: InsertAction', done => {
    let doc = svg.parse(googleSVG, 'google.svg');

    let items = [doc.elementsFlat[0]];

    for (let item of items) {
      roundTrip(
        new actions.InsertAction({
          items: [
            {
              index: new Index([1, 4]),
              item
            }
          ]
        }),
        true
      );
    }

    done();
  });

  it('actions: ShiftSegmentAction', done => {
    testRoundTrip(
      new actions.ShiftSegmentAction({
        index: new Index([1, 4, 2, 10]),
        n: 3
      })
    );

    done();
  });

  it('actions: ReverseSegmentAction', done => {
    testRoundTrip(
      new actions.ReverseSegmentAction({
        index: new Index([1, 4, 2, 10])
      })
    );

    done();
  });

  it('actions: CloseSegmentAction', done => {
    testRoundTrip(
      new actions.CloseSegmentAction({
        index: new Index([1, 4, 2, 10])
      })
    );

    done();
  });

  it('actions: OpenSegmentAction', done => {
    testRoundTrip(
      new actions.OpenSegmentAction({
        index: new Index([1, 4, 2, 10])
      })
    );

    done();
  });

  it('actions: GroupAction', done => {
    testRoundTrip(
      new actions.GroupAction({
        groupIndex: new Index([1, 4, 2]),
        childIndexes: [new Index([1, 4, 2, 3]), new Index([1, 4, 2, 10])]
      })
    );

    done();
  });

  it('actions: UngroupAction', done => {
    testRoundTrip(
      new actions.UngroupAction({
        groupIndex: new Index([1, 4, 2]),
        childIndexes: [new Index([1, 4, 2, 3]), new Index([1, 4, 2, 10])]
      })
    );

    done();
  });

  it('actions: SplitPathAction', done => {
    testRoundTrip(
      new actions.SplitPathAction({
        splitIndex: new Index([1, 4, 2])
      })
    );

    done();
  });

  it('actions: UnsplitPathAction', done => {
    testRoundTrip(
      new actions.UnsplitPathAction({
        splitIndex: new Index([1, 4, 2])
      })
    );

    done();
  });

  it('actions: ToggleMetadataBoolAction', done => {
    testRoundTrip(
      new actions.ToggleMetadataBoolAction({
        indexes: [new Index([1, 4, 2]), new Index([1, 4, 3])],
        key: 'visible'
      })
    );

    done();
  });

  it('actions: SetDocDimensionsAction', done => {
    testRoundTrip(
      new actions.SetDocDimensionsAction({
        width: 1000,
        prevWidth: 500,
        height: 800,
        prevHeight: 400
      })
    );

    done();
  });

  it('actions: SetDocNameAction', done => {
    done();
  });

  it('actions: SetAttributeAction', done => {
    let vals = [
      { key: 'x', value: 12910394810, oldValue: 20.2 },
      { key: 'x', value: 2.501, oldValue: 92910394810 },
      { key: 'name', value: 'hola', oldValue: 'hello' },
      { key: 'fill', value: new Color(10, 10, 10), oldValue: 'none' }
    ];

    for (let val of vals) {
      testRoundTrip(
        new actions.SetAttributeAction({
          key: val.key,
          items: [
            {
              index: new Index([20, 1, 9]),
              value: val.value,
              oldValue: val.oldValue
            }
          ]
        })
      );
    }

    done();
  });
});
