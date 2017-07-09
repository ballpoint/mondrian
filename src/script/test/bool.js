import LineSegment from 'geometry/line-segment';
import Path from 'geometry/path';
import { EdgeSet } from 'lib/bool';
import bool from 'lib/bool';
import assert from 'assert';

describe("Edge", function() {
  it('calculates its line segment', (done) => {
    let edges = EdgeSet.fromPath(Path.rectangle({
      x: 10,
      y: 10,
      width: 20,
      height: 40,
    }));

    let edge1Ls = edges.get(0).lineSegment;

    assert.equal(true, edge1Ls instanceof LineSegment);
    assert.equal(edge1Ls.a.x, 10);
    assert.equal(edge1Ls.a.y, 10);
    assert.equal(edge1Ls.b.x, 30);
    assert.equal(edge1Ls.b.y, 10);

    done();
  });
});

describe("EdgeSet", function() {
  it('builds edges from path', (done) => {
    let edges = EdgeSet.fromPath(Path.rectangle({
      x: 10,
      y: 10,
      width: 20,
      height: 40,
    }));

    assert.equal(4, edges.length);

    assert.equal(edges.get(0).next, edges.get(1));
    assert.equal(edges.get(0).prev, edges.get(3));

    assert.equal(edges.get(1).next, edges.get(2));
    assert.equal(edges.get(1).prev, edges.get(0));

    assert.equal(edges.get(3).next, edges.get(0));
    assert.equal(edges.get(3).prev, edges.get(2));

    done();
  });

  it('intersects', (done) => {
    let es1 = EdgeSet.fromPath(Path.rectangle({
      x: 0,
      y: 0,
      width: 40,
      height: 40,
    }));

    let es2 = EdgeSet.fromPath(Path.rectangle({
      x: 20,
      y: 20,
      width: 40,
      height: 40,
    }));

    // A pair of squares where the second's origin is the middle of
    // the first. They should have two intersections:
    // - 40,20
    // - 20,40

    es1.intersect(es2);

    assert.equal(6, es1.length);
    assert.equal(6, es2.length);

    assert.equal(6, es1.twins.length);
    assert.equal(6, es2.twins.length);

    // Make sure pointers are correct
    for (let edge of es1.edges) {
      assert.equal(edge.origin.x, edge.prev.destination.x);
      assert.equal(edge.origin.y, edge.prev.destination.y);

      assert.equal(edge.twin.origin.x, edge.destination.x);
      assert.equal(edge.twin.origin.y, edge.destination.y);

      assert.equal(edge.twin.destination.x, edge.origin.x);
      assert.equal(edge.twin.destination.y, edge.origin.y);

      assert.equal(edge.twin.prev.destination.x, edge.destination.x);
      assert.equal(edge.twin.prev.destination.y, edge.destination.y);

      assert.equal(edge.twin.next.origin.x, edge.origin.x);
      assert.equal(edge.twin.next.origin.y, edge.origin.y);
    }

    done();
  });
});

describe("Boolean operations", function() {
  let r1 = Path.rectangle({
    x: 0,
    y: 0,
    width: 40,
    height: 40,
  });

  let r2 = Path.rectangle({
    x: 20,
    y: 20,
    width: 40,
    height: 40,
  });

  it('union', (done) => {
    bool.union([r1.points, r2.points]);

    done();
  });
});
