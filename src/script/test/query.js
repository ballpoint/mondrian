import Query from 'io/query';
import assert from 'assert';

describe("Query", function() {
	it("sorts correctly", function(done) {
		let q1 = new Query([0,2]);
		let q2 = new Query([0,3]);

    assert.equal(true, q1.less(q2));


		let q3 = new Query([0,3,4]);

    // Queries of unequal depth always return false
    assert.equal(false, q2.less(q3));
    assert.equal(false, q3.less(q2));

    let qs = [
      new Query([0,2,5]),
      new Query([0,3,1]),
      new Query([1,0,2]),
      new Query([0,1,0]),
    ];

    let qsSorted = qs.sort((a, b) => { return b.less(a) });

    assert.equal(qsSorted[0].toString(), '0:1:0');
    assert.equal(qsSorted[1].toString(), '0:2:5');
    assert.equal(qsSorted[2].toString(), '0:3:1');
    assert.equal(qsSorted[3].toString(), '1:0:2');

    done();
    
	});

	it("compares equality", function(done) {
    let q1 = new Query([0,3,6]);
    let q2 = new Query([0,3,6]);
    let q3 = new Query([1,3,6]);
    let q4 = new Query([0,3]);

    assert.equal(true, q1.equal(q2));
    assert.equal(true, q2.equal(q1));
    assert.equal(false, q1.equal(q3));
    assert.equal(false, q1.equal(q4));
    assert.equal(false, q3.equal(q4));

    done();
  });
});

