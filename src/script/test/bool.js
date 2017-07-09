import Path from 'geometry/path';
import { pathToEdges } from 'lib/bool';
import assert from 'assert';

describe("pathToEdges", function() {
  it('builds edges from path', (done) => {
    let path = Path.rectangle({
      x: 10,
      y: 10,
      width: 20,
      height: 40,
    });

    let edges = pathToEdges(path);

    assert.equal(4, edges.length);

    assert.equal(edges[0].next, edges[1]);
    assert.equal(edges[0].prev, edges[3]);

    assert.equal(edges[1].next, edges[2]);
    assert.equal(edges[1].prev, edges[0]);

    assert.equal(edges[3].next, edges[0]);
    assert.equal(edges[3].prev, edges[2]);

    done();
  });
});


