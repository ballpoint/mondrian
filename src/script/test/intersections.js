import LineSegment from 'geometry/line-segment';
import Posn from 'geometry/posn';
import Bounds from 'geometry/bounds';
import Path from 'geometry/path';
import shapes from 'lab/shapes';
import { OUTSIDE, INCIDENT, INSIDE } from 'lab/shapes';
import assert from 'assert';
import chai from 'chai';

describe('shapes.contains', function() {
  it('bounds', done => {
    let b = new Bounds(0, 0, 100, 100);
    let p = new Posn(50, 50);
    chai.assert.isTrue(shapes.contains(b, p));

    done();
  });
});

describe('shapes.contains', function() {
  it('shape contains 1', done => {
    let shape1Data =
      'M204.48023402857382,20.750397906866958 L204.48023402857382,148.4820011345568 C204.48023402857382,201.02453405443518 174.54414740904548,222.48421325064942 139.1538669540752,222.48421325064942 C105.83989892509689,222.48421325064942 85.78953863230726,199.42067163319373 78.22804263317171,180.55924955939113 L104.50734020393766,169.2359808654246 C109.18679059684536,180.81586754678978 120.6529935463542,194.4807753757693 139.12287721637352,194.4807753757693 C161.77637547607887,194.4807753757693 175.8147266548019,180.01393633616888 175.8147266548019,152.78035242348463 L175.8147266548019,142.54771017596258 L174.76107557295515,142.54771017596258 C168.00531275405524,151.17649000224307 154.98962291947768,158.71464338207906 138.56506193774888,158.71464338207906 C104.19744282692386,158.71464338207906 72.71186932232679,127.72802140368918 72.71186932232679,87.8560016116202 C72.71186932232679,47.695286583727736 104.19744282692386,16.4520466179392 138.56506193774888,16.4520466179392 C154.9586331817764,16.4520466179392 167.974323016354,23.990199997775246 174.76107557295515,32.36236183665698 L175.8147266548019,32.36236183665698 L175.8147266548019,20.78247515529183 L204.48023402857382,20.750397906866958 M177.95301855619684,87.88807886004503 C177.95301855619684,62.83574784024955 161.8073652137802,44.51963898966916 141.26116911776833,44.51963898966916 C120.43606538244438,44.51963898966916 102.98884305657032,62.83574784024955 102.98884305657032,87.88807886004503 C102.98884305657032,112.68379189244197 120.43606538244438,130.7432827556236 141.26116911776833,130.7432827556236 C161.8073652137802,130.7432827556236 177.95301855619684,112.68379189244195 177.95301855619684,87.88807886004503';

    let shape1 = new Path({
      d: shape1Data
    });

    // Insane
    let posn1 = new Posn(192.48023402857382, 148.4820011345568);
    let posn2 = new Posn(192.48023402857382, 148.4820011345567);

    let p = new Posn(0, 0);

    let b1 = shapes.contains(shape1, posn1);
    let b2 = shapes.contains(shape1, posn2);

    console.log(b1, b2);

    assert.equal(b1, true);
    assert.equal(b2, true);

    done();
  });
});

describe('incident', function() {
  it('shape contains 1', done => {
    let circle = Path.ellipse({
      cx: 0,
      cy: 0,
      rx: 10,
      ry: 10
    });

    let circle2 = Path.ellipse({
      cx: 0,
      cy: 0,
      rx: 10,
      ry: 10
    });

    circle2.rotate(10);

    let rect = Path.rectangle({
      x: -10,
      y: -10,
      width: 20,
      height: 20
    });

    chai.assert.equal(INCIDENT, shapes.relationship(circle, new Posn(0, 10)));
    chai.assert.equal(INCIDENT, shapes.relationship(circle, new Posn(0, -10)));
    chai.assert.equal(INCIDENT, shapes.relationship(circle, new Posn(-10, 0)));
    chai.assert.equal(INCIDENT, shapes.relationship(circle, new Posn(10, 0)));

    chai.assert.equal(INCIDENT, shapes.relationship(rect, new Posn(10, 10)));
    chai.assert.equal(INCIDENT, shapes.relationship(rect, new Posn(-10, 10)));
    chai.assert.equal(INCIDENT, shapes.relationship(rect, new Posn(-10, -10)));
    chai.assert.equal(INCIDENT, shapes.relationship(rect, new Posn(10, -10)));

    chai.assert.equal(
      INCIDENT,
      shapes.relationship(circle, circle2.points.all()[0])
    );
    debugger;
    chai.assert.equal(
      INCIDENT,
      shapes.relationship(circle, circle2.points.all()[1])
    );
    debugger;
    chai.assert.equal(
      INCIDENT,
      shapes.relationship(circle, circle2.points.all()[2])
    );
    chai.assert.equal(
      INCIDENT,
      shapes.relationship(circle, circle2.points.all()[3])
    );

    done();
  });
});
