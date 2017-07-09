import Posn from 'geometry/posn';
import CubicBezier from 'geometry/cubic-bezier-line-segment';
import assert from 'assert';
import assertUtil from 'test/util';

describe("CubicBezier", function() {
  it('works as expected when it\'s a straight line', (done) => {
    let cb = new CubicBezier(
      new Posn(0, 10),
      new Posn((10/3), 10),
      new Posn((10/3)*2, 10),
      new Posn(10, 10),
    );

    assertUtil.within(0.1, cb.findPercentageOfPoint(new Posn(1, 10)), 0.001);
    assertUtil.within(0.2, cb.findPercentageOfPoint(new Posn(2, 10)), 0.001);
    assertUtil.within(0.4, cb.findPercentageOfPoint(new Posn(4, 10)), 0.001);
    assertUtil.within(0.5, cb.findPercentageOfPoint(new Posn(5, 10)), 0.001);
    assertUtil.within(0.52, cb.findPercentageOfPoint(new Posn(5.2, 10)), 0.001);
    assertUtil.within(0.87, cb.findPercentageOfPoint(new Posn(8.7, 10)), 0.001);

    done();
  });

  it('splitAt findPercentageOfPoint round trip', (done) => {
    let cb = new CubicBezier(
      new Posn(0, 10),
      new Posn(2, 2),
      new Posn(8, -2),
      new Posn(10, 10),
    );

    for (let perc of [0.1, 0.329, 0.5, 0.8]) {
      let split = cb.splitAt(perc);
      let posn = split[0].p4;
      let calculatedPerc = cb.findPercentageOfPoint(posn);
      assertUtil.within(perc, calculatedPerc, 0.001);
    }

    done();
  });
});
