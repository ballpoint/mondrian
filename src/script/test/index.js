import Index from 'geometry/index';
import assert from 'assert';

describe("Index", function() {
	it("sorts correctly", function(done) {
		let q1 = new Index([0,2]);
		let q2 = new Index([0,3]);
		let q3 = new Index([0,3,4]);
		let q4 = new Index([1,0]);

    assert.equal(-1, q1.compare(q2));
    assert.equal(-1, q2.compare(q3), 'shallower index with equal common parts is lesser');
    assert.equal(1, q3.compare(q2), 'deeper index with equal common parts is greater');
    assert.equal(-1, q3.compare(q4), 'different length indexes with unequal common parts sort the same way');

    let qs = [
      new Index([0,2,5]),
      new Index([0,3,1]),
      new Index([1,0,2]),
      new Index([0,1,0]),
    ];

    qs.sort((a, b) => { return a.compare(b) });

    assert.equal(qs[0].toString(), '0:1:0');
    assert.equal(qs[1].toString(), '0:2:5');
    assert.equal(qs[2].toString(), '0:3:1');
    assert.equal(qs[3].toString(), '1:0:2');

    let qs2 = ["0:2:0:10", "0:2:1:0", "0:2:1:2", "0:1:0:0", "0:1:0:2", "0:1:1:0", "0:1:1:2", "0:0:0:0", "0:0:0:2", "0:0:1:0", "0:0:1:2"]
      .map((s) => { return Index.fromString(s) });

    qs2.sort((a, b) => { return a.compare(b) });

    assert.equal(qs2[0].toString(), '0:0:0:0');
    assert.equal(qs2[1].toString(), '0:0:0:2');
    assert.equal(qs2[2].toString(), '0:0:1:0');
    assert.equal(qs2[3].toString(), '0:0:1:2');

    done();
    
	});

	it("compares equality", function(done) {
    let q1 = new Index([0,3,6]);
    let q2 = new Index([0,3,6]);
    let q3 = new Index([1,3,6]);
    let q4 = new Index([0,3]);

    assert.equal(true, q1.equal(q2));
    assert.equal(true, q2.equal(q1));
    assert.equal(false, q1.equal(q3));
    assert.equal(false, q1.equal(q4));
    assert.equal(false, q3.equal(q4));

    done();
  });
});

