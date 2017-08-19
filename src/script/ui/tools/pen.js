import consts from 'consts';
import shapes from 'lab/shapes';
import Tool from 'ui/tools/tool';
import Bounds from 'geometry/bounds';
import Path from 'geometry/path';
import PathPoint from 'geometry/path-point';
import LineSegment from 'geometry/line-segment';
import CubicBezier from 'geometry/cubic-bezier-line-segment';

import HistoryFrame from 'history/Frame';
import * as actions from 'history/actions/actions';

const PEN_POINT_THRESHOLD = 15;

const PEN_SCAN_PRECISION = 0.1;

export default class Pen extends Tool {
  constructor(editor) {
    super(editor);
  }

  get id() {
    return 'pen';
  }

  handleMousemove(e, cursor) {
    if (this.editor.cursor.dragging) {
      return;
    }

    if (this.pathItem) {
      return;
    }

    delete this.closest;

    let elemsToScan = [];

    let posn = cursor.posnCurrent;

    let p = this.editor.projection.posn(posn);
    let threshold = this.editor.projection.zInvert(PEN_POINT_THRESHOLD);

    // Find candidates for near-point check
    for (let elem of this.editor.doc.elementsFlat) {
      let bounds = this.editor.projection
        .bounds(elem.bounds())
        .padded(threshold);
      if (shapes.contains(bounds, p)) {
        elemsToScan.push(elem);
      }
    }

    for (let elem of elemsToScan) {
      let points = elem.getPoints();
      for (let pt of points) {
        let ls = pt.toLineSegment();

        let closestPosn = ls.closestPosn(posn);
        let d = closestPosn.distanceFrom(posn);

        if (d < threshold && (!this.closest || d < this.closest.d)) {
          this.closest = {
            posn: closestPosn,
            pathPoint: pt,
            d: d,
            splits: ls.splitAt(closestPosn),
            bounds: ls.bounds()
          };
        }
      }
    }
  }

  handleMousedown(e, cursor) {
    this.handleNewPoint(e, cursor);
  }

  handleClick(e, cursor) {
    if (this.closest) {
      let splits = this.closest.splits;
      let d1 = this.closest.pathPoint.prec;
      let d2 = this.closest.pathPoint;

      // Build the three new points we're replacing the original two with
      let n1 = new PathPoint(d1.x, d1.y); // Replaces d1
      n1.setPHandle(d1.getPHandle()); // Stays the same
      if (splits[0] instanceof CubicBezier) {
        n1.setSHandle(splits[0].p2); // Derived from new split bezier
      }

      let n2 = new PathPoint(this.closest.posn); // The newly inserted point
      if (splits[0] instanceof CubicBezier) {
        n2.setPHandle(splits[0].p3); // Derived
      }
      if (splits[1] instanceof CubicBezier) {
        n2.setSHandle(splits[1].p2); // Derived
      }

      let n3 = new PathPoint(d2.x, d2.y); // Replaces d2
      if (splits[1] instanceof CubicBezier) {
        n3.setPHandle(splits[1].p3); // Derived from new split bezier
      }
      n3.setSHandle(d2.getSHandle()); // Stays the same

      let startIndex = this.closest.pathPoint.prec.index;

      // Insert new PathPoint
      let frame = new HistoryFrame(
        [
          new actions.DeleteAction({
            items: [
              {
                item: this.closest.pathPoint.prec,
                index: this.closest.pathPoint.prec.index
              },
              {
                item: this.closest.pathPoint,
                index: this.closest.pathPoint.index
              }
            ]
          }),
          new actions.InsertAction({
            items: [
              { item: n1, index: startIndex },
              { item: n2, index: startIndex.plus(1) },
              { item: n3, index: startIndex.plus(2) }
            ]
          })
        ],
        'Add point'
      );

      frame.seal();

      this.editor.perform(frame);

      // Only select the new point
      this.editor.selectFromIndexes([startIndex.plus(1)]);

      delete this.closest;
    }
  }

  handleMouseup(e, cursor) {
    if (!this.closest) {
      this.handleNewPoint(e, cursor);
      this.editor.commitFrame();
      this.pathItemCommitted = true;
      this.pathItemPointIndex++;
    }
  }

  handleDragStart(e, cursor) {}

  handleDrag(e, cursor) {
    this.handleNewPoint(e, cursor);
  }

  handleDragStop(e, cursor) {}

  handleNewPoint(e, cursor) {
    // If we're not focusing on adding a point to an existing shape, start a new shape
    let frame = new HistoryFrame([], 'Add point');

    if (!this.pathItem) {
      this.pathItem = new Path({
        fill: this.editor.state.colors.fill,
        stroke: this.editor.state.colors.stroke
      });
      this.pathIndex = this.editor.state.layer.nextChildIndex();
      this.pathItemCommitted = false;
      this.pathItemPointIndex = 0;
    }

    if (!this.pathItemCommitted) {
      frame.push(
        new actions.InsertAction({
          items: [{ item: this.pathItem, index: this.pathIndex }]
        })
      );
    }

    let pp = new PathPoint(cursor.posnDown.x, cursor.posnDown.y);

    if (!cursor.posnCurrent.equal(cursor.posnDown)) {
      pp.setSHandle(cursor.posnCurrent);
      pp.setPHandle(cursor.posnCurrent.reflect(cursor.posnDown));
    }

    frame.push(
      new actions.InsertAction({
        items: [
          {
            item: pp,
            index: this.pathIndex.concat([0, this.pathItemPointIndex])
          }
        ]
      })
    );

    this.editor.perform(frame);
    this.editor.setSelection([pp]);
  }

  refresh(layer, context) {
    if (this.closest) {
      let proj = this.editor.projection;
      let splits = this.closest.splits;
      let pointStyles = { stroke: consts.point, fill: 'white' };

      if (
        splits[0] instanceof CubicBezier &&
        splits[1] instanceof CubicBezier
      ) {
        let pHandle = splits[0].p3;
        let sHandle = splits[1].p2;

        let pt = new PathPoint(this.closest.posn.x, this.closest.posn.y);
        pt.setPHandle(pHandle);
        pt.setSHandle(sHandle);

        let p = proj.posn(pt);
        let pp = proj.posn(pt.pHandle);
        let ps = proj.posn(pt.sHandle);

        layer.drawLineSegment(p, ps, pointStyles);
        layer.drawLineSegment(p, pp, pointStyles);

        layer.drawLineSegment(
          proj.posn(splits[0].p1),
          proj.posn(splits[0].p2),
          pointStyles
        );
        layer.drawLineSegment(
          proj.posn(splits[1].p3),
          proj.posn(splits[1].p4),
          pointStyles
        );

        // Draw new point
        layer.drawCircle(p, 3.5, pointStyles);
        layer.drawCircle(pp, 2.5, pointStyles);
        layer.drawCircle(ps, 2.5, pointStyles);

        // Draw new section of existing points
        layer.drawCircle(proj.posn(splits[0].p1), 3.5, pointStyles);
        layer.drawCircle(proj.posn(splits[0].p2), 2.5, pointStyles);
        layer.drawCircle(proj.posn(splits[1].p3), 2.5, pointStyles);
        layer.drawCircle(proj.posn(splits[1].p4), 3.5, pointStyles);
      } else if (
        splits[0] instanceof LineSegment &&
        splits[1] instanceof LineSegment
      ) {
        layer.drawCircle(proj.posn(splits[0].a), 3.5, pointStyles);
        layer.drawCircle(proj.posn(splits[0].b), 3.5, pointStyles);
        layer.drawCircle(proj.posn(splits[1].b), 3.5, pointStyles);
      }
    }
  }
}
