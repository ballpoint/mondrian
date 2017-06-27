import shapes from 'lab/shapes';
import Tool from 'ui/tools/tool';
import Bounds from 'geometry/bounds';
import PathPoint from 'geometry/path-point';

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

    let closestPosn, closestD, closestPerc, closestSplits, closestBounds;

    for (let elem of elemsToScan) {
      let lss = elem.lineSegments();
      for (let ls of lss) {
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
                if (closestD === undefined || d < closestD) {
                  closestPosn = splitPosn;
                  closestD = d;
                  closestPerc = splitPerc;
                  closestSplits = ls.splitAt(splitPerc);
                  closestBounds = ls.bounds();
                }
              }
            }
          }
          //console.timeEnd('checkLS');
        }
      }
    }

    this.closestPosn = closestPosn;
    this.closestD = closestD;
    this.closestSplits = closestSplits;
    this.closestBounds = closestBounds;
  }

  handleMousedown(e, posn) {
  }

  handleClick(e, posn) {
  }

  handleDragStart(e, posn) {
  }

  handleDrag(e, posn) {
  }

  handleDragStop(e, posn) {
  }

  refresh(layer, context) {
    if (this.closestSplits) {
      let pHandle = this.closestSplits[0].p3;
      let sHandle = this.closestSplits[1].p2;

      let pt = new PathPoint(
        this.closestPosn.x, this.closestPosn.y
      );
      pt.setPHandle(pHandle);
      pt.setSHandle(sHandle);

      let p = this.editor.projection.posn(pt);
      let pp = this.editor.projection.posn(pt.pHandle);
      let ps = this.editor.projection.posn(pt.sHandle);

      layer.drawCircle(p, 3, { stroke: 'blue' })
      layer.drawCircle(pp, 3, { stroke: 'blue' })
      layer.drawCircle(ps, 3, { stroke: 'blue' })
      layer.drawLineSegment(p, ps, { stroke: 'blue' })
      layer.drawLineSegment(p, pp, { stroke: 'blue' })

      layer.drawCircle(this.editor.projection.posn(this.closestSplits[0].p1), 3, { stroke: 'blue' })
      layer.drawCircle(this.editor.projection.posn(this.closestSplits[0].p2), 3, { stroke: 'blue' })
      layer.drawCircle(this.editor.projection.posn(this.closestSplits[1].p3), 3, { stroke: 'blue' })
      layer.drawCircle(this.editor.projection.posn(this.closestSplits[1].p4), 3, { stroke: 'blue' })
      layer.drawLineSegment(this.editor.projection.posn(this.closestSplits[0].p1), this.editor.projection.posn(this.closestSplits[0].p2), { stroke: 'blue' })
      layer.drawLineSegment(this.editor.projection.posn(this.closestSplits[1].p3), this.editor.projection.posn(this.closestSplits[1].p4), { stroke: 'blue' })

      //layer.drawRect(this.editor.projection.bounds(this.closestBounds), { stroke: 'black' });
    }
  }

}

