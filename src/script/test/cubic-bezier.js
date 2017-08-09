import Posn from 'geometry/posn';
import CubicBezier from 'geometry/cubic-bezier-line-segment';
import assert from 'assert';
import assertUtil from 'test/util';
import chai from 'chai';
import shapes from 'lab/shapes';

describe('CubicBezier', function() {
  it("works as expected when it's a straight line", done => {
    let cb = new CubicBezier(
      new Posn(0, 10),
      new Posn(10 / 3, 10),
      new Posn(10 / 3 * 2, 10),
      new Posn(10, 10)
    );

    assertUtil.within(0.1, cb.findPercentageOfPosn(new Posn(1, 10)), 0.001);
    assertUtil.within(0.2, cb.findPercentageOfPosn(new Posn(2, 10)), 0.001);
    assertUtil.within(0.4, cb.findPercentageOfPosn(new Posn(4, 10)), 0.001);
    assertUtil.within(0.5, cb.findPercentageOfPosn(new Posn(5, 10)), 0.001);
    assertUtil.within(0.52, cb.findPercentageOfPosn(new Posn(5.2, 10)), 0.001);
    assertUtil.within(0.87, cb.findPercentageOfPosn(new Posn(8.7, 10)), 0.001);

    done();
  });

  it('splitAt findPercentageOfPosn round trip', done => {
    let cb = new CubicBezier(
      new Posn(0, 10),
      new Posn(2, 2),
      new Posn(8, -2),
      new Posn(10, 10)
    );

    for (let perc of [0.1, 0.329, 0.5, 0.8]) {
      let split = cb.splitAt(perc);
      let posn = split[0].p4;
      let calculatedPerc = cb.findPercentageOfPosn(posn);
      assertUtil.within(perc, calculatedPerc, 0.001);
    }

    done();
  });

  it('handles intersections', done => {
    let c1 = new CubicBezier(
      new Posn(169.78713546239803, 104.64514289267613),
      new Posn(167.43103575881548, 130.09348307511416),
      new Posn(146.04022595452193, 150),
      new Posn(120, 150)
    );

    let c2 = new CubicBezier(
      new Posn(113.61580366762904, 149.5963227684857),
      new Posn(125.9753648760792, 128.44150524428468),
      new Posn(145.94145691669456, 112.20734902976737),
      new Posn(169.78713546239803, 104.64514289267613)
    );

    let xns = shapes.intersections(c1, c2);

    console.log(xns);

    done();
  });

  it('isIncident', done => {
    let c1 = new CubicBezier(
      new Posn(113.61580366762904, 149.5963227684857),
      new Posn(125.9753648760792, 128.44150524428468),
      new Posn(145.94145691669456, 112.20734902976737),
      new Posn(169.78713546239803, 104.64514289267613)
    );
    let p1 = new Posn(113.61580366762904, 149.5963227684857);
    let p2 = new Posn(103.61580366762904, 149.5963227684857);

    chai.assert.isTrue(c1.isIncident(p1));
    chai.assert.isFalse(c1.isIncident(p2));

    done();
  });
});
