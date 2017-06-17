import Query from 'io/query';

import assert from 'assert';

describe("Query", function() {
	it("should sort itself correctly", function(done) {
		let q1 = new Query([0,2]);
		let q2 = new Query([0,3]);

    assert.equal(true, q1.less(q2));


		let q3 = new Query([0,3,4]);
		let q4 = new Query([0,3]);

    assert.equal(true, q3.less(q4));

    done();
    
	});
});
