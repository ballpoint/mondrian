import consts from 'consts';
import shapes from 'lab/shapes';
import Tool from 'ui/tools/tool';
import Bounds from 'geometry/bounds';
import PathPoint from 'geometry/path-point';
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

  handleMousemove(e, posn) {
    if (this.editor.cursor.dragging) {
      return;
    }

    let elemsToScan = [];

    let p = this.editor.projection.posn(posn);
    
    // Find candidates for near-point check
    for (let elem of this.editor.doc.elementsFlat) {
      let bounds = this.editor.projection.bounds(elem.bounds()).padded(PEN_POINT_THRESHOLD);
      if (shapes.contains(bounds, p)) {
        elemsToScan.push(elem);
      }
    }

    delete this.closest;

    let closest;

    for (let elem of elemsToScan) {
      let points = elem.getPoints();
      for (let pt of points) {
        let ls = pt.toLineSegment();
        let lsbounds = this.editor.projection.bounds(ls.bounds()).padded(PEN_POINT_THRESHOLD);

        let closestPosnLocally, closestDLocally, closestPercLocally;

        // If posn is within the bounds of this line, we check the line for nearest point
        let lastSplitPosn;
        if (shapes.contains(lsbounds, p)) {
          //console.time('checkLS');
          let avgDistanceBetween = 0;

          for (let splitPerc = 0; splitPerc < 1; splitPerc += PEN_SCAN_PRECISION) {
            let splitPosn = ls.posnAt(splitPerc);
            let d = splitPosn.distanceFrom(posn);

            if (closestDLocally === undefined || d < closestDLocally) {
              closestPosnLocally = splitPosn;
              closestDLocally = d;
              closestPercLocally = splitPerc;
            }

            if (lastSplitPosn) {
              let d = this.editor.projection.z(splitPosn.distanceFrom(lastSplitPosn));
              avgDistanceBetween += d;
            }
            lastSplitPosn = splitPosn;
          }

          // Determine how small our step has to be when iterating
          // to find the nearest point.
          avgDistanceBetween /= 10.0;

          // If a PEN_SCAN_PRECISION jump yielded an average of avgDistanceBetween pixels and we want to be
          // within 2 pixels, we simply divide.
          let precision = PEN_SCAN_PRECISION
          if (avgDistanceBetween > 2) {
            precision /= (avgDistanceBetween / 2);
          }

          if (closestPercLocally !== undefined) {
            let splitStart = Math.max(0, closestPercLocally - PEN_SCAN_PRECISION);
            let splitEnd =   Math.min(1, closestPercLocally + PEN_SCAN_PRECISION);
            for (let splitPerc = splitStart; splitPerc < splitEnd; splitPerc += precision) {
              let splitPosn = ls.posnAt(splitPerc);
              let d = splitPosn.distanceFrom(posn);

              if (this.editor.projection.z(d) <= PEN_POINT_THRESHOLD) {
                if (!this.closest || d < this.closest.d) {
                  this.closest = {
                    posn: splitPosn,
                    pathPoint: pt,
                    d: d,
                    perc: splitPerc,
                    splits: ls.splitAt(splitPerc),
                    bounds: ls.bounds(),
                  }
                }
              }
            }
          }
          //console.timeEnd('checkLS');
        }
      }
    }

  }

  handleMousedown(e, posn) {
  }

  handleClick(e, posn) {
    if (this.closest) {
      let splits = this.closest.splits;
      let d1 = this.closest.pathPoint.prec;
      let d2 = this.closest.pathPoint;

      // Build the three new points we're replacing the original two with
      let n1 = new PathPoint(d1.x, d1.y);
      n1.setPHandle(d1.getPHandle());          // Stays the same
      n1.setSHandle(splits[0].p2); // Derived from new split bezier

      let n2 = new PathPoint(this.closest.posn);
      n2.setPHandle(splits[0].p3);
      n2.setSHandle(splits[1].p2);

      let n3 = new PathPoint(d2.x, d2.y);
      n3.setPHandle(splits[1].p3);    // Derived from new split bezier
      n3.setSHandle(d2.getSHandle()); // Stays the same

      let startIndex = this.closest.pathPoint.prec.index;

      // Insert new PathPoint
      let frame = new HistoryFrame([
        new actions.DeleteAction({
          items: [
            { item: this.closest.pathPoint.prec, index: this.closest.pathPoint.prec.index },
            { item: this.closest.pathPoint, index: this.closest.pathPoint.index },
          ]
        }),
        new actions.InsertAction({
          items: [
            { item: n1, index: startIndex },
            { item: n2, index: startIndex.plus(1) },
            { item: n3, index: startIndex.plus(2) },
          ]
        }),
      ]);

      this.editor.perform(frame);

      delete this.closest;
    }
  }

  handleDragStart(e, posn) {
  }

  handleDrag(e, posn) {
  }

  handleDragStop(e, posn) {
  }

  refresh(layer, context) {
    if (this.closest) {
      let splits = this.closest.splits;
      let pHandle = splits[0].p3;
      let sHandle = splits[1].p2;

      let pt = new PathPoint(
        this.closest.posn.x, this.closest.posn.y
      );
      pt.setPHandle(pHandle);
      pt.setSHandle(sHandle);

      let p = this.editor.projection.posn(pt);
      let pp = this.editor.projection.posn(pt.pHandle);
      let ps = this.editor.projection.posn(pt.sHandle);

      let pointStyles = { stroke: consts.point, fill: 'white' };

      layer.drawLineSegment(p, ps, pointStyles)
      layer.drawLineSegment(p, pp, pointStyles)

      layer.drawLineSegment(this.editor.projection.posn(splits[0].p1), this.editor.projection.posn(splits[0].p2), pointStyles)
      layer.drawLineSegment(this.editor.projection.posn(splits[1].p3), this.editor.projection.posn(splits[1].p4), pointStyles)

      // Draw new point
      layer.drawCircle(p, 3.5, pointStyles)
      layer.drawCircle(pp, 2.5, pointStyles)
      layer.drawCircle(ps, 2.5, pointStyles)

      // Draw new section of existing points
      layer.drawCircle(this.editor.projection.posn(splits[0].p1), 3.5, pointStyles)
      layer.drawCircle(this.editor.projection.posn(splits[0].p2), 2.5, pointStyles)
      layer.drawCircle(this.editor.projection.posn(splits[1].p3), 2.5, pointStyles)
      layer.drawCircle(this.editor.projection.posn(splits[1].p4), 3.5, pointStyles)
    }
  }

}

