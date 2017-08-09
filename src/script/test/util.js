import assert from 'assert';

export default {
  within(a, b, tolerance) {
    let diff = Math.abs(a - b);
    assert.equal(
      true,
      diff < tolerance,
      `Expected threshold ${a} to be within ${tolerance} of ${b}: actual diff ${diff}`
    );
  }
};
