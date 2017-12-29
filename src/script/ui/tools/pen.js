import consts from 'consts';
import shapes from 'lab/shapes';
import Tool from 'ui/tools/tool';
import Bounds from 'geometry/bounds';
import Circle from 'geometry/circle';
import Path from 'geometry/path';
import PathPoint from 'geometry/path-point';
import LineSegment from 'geometry/line-segment';
import CubicBezier from 'geometry/cubic-bezier-line-segment';
import Element from 'ui/element';

import HistoryFrame from 'history/Frame';
import * as actions from 'history/actions/actions';

const PEN_POINT_THRESHOLD = 15;

const PEN_SCAN_PRECISION = 0.1;

export default class Pen extends Tool {
  constructor(editor) {
    super(editor);

    this.resetState();
  }

  resetState() {
    this.pathItemCommitted = false;

    delete this.nextChildIndex;
    delete this.rootSegmentIndex;
    delete this._endedPath;
  }

  get id() {
    return 'pen';
  }

  cleanup() {
    this.editor.cursorHandler.unregisterElement(/endpoint.*/);
  }

  handleMousemove(e, cursor) {
    delete this.closest;

    if (this.editor.cursor.dragging) {
      return;
    }

    if (this.rootSegmentIndex) {
      // This means we're working on a path and are not in path splitting mode
      return;
    }

    let active = this.editor.cursorHandler.active;
    if (active && /endpoint/.test(active.id)) {
      return;
    }

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
      pointLoop: for (let pt of points) {
        let segment = pt.segment;
        let ls = pt.toLineSegment();

        let closestPosn = ls.closestPosn(posn);
        let d = closestPosn.distanceFrom(posn);

        if (
          d < threshold &&
          (!this.closest || d < this.closest.d) &&
          (!this.closest || !this.closest.endpoint)
        ) {
          this.closest = {
            posn: closestPosn,
            pathPoint: pt,
            d: d,
            splits: ls.splitAt(closestPosn),
            bounds: Bounds.forLineSegment(ls)
          };
        }
      }
    }
  }

  handleMousedown(e, cursor) {
    this.handleNewPoint(e, cursor, false);
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
          new actions.RemoveAction({
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

      this.editor.stageFrame(frame);
      this.editor.commitFrame();

      // Only select the new point
      this.editor.selectFromIndexes([startIndex.plus(1)]);

      delete this.closest;
    }
  }

  handleMouseup(e, cursor) {
    if (!this.closest) {
      this.editor.commitFrame();
      this.pathItemCommitted = true;
      this.currentPointIndex = this.currentPointIndex.plus(1);

      if (this._endedPath) {
        delete this.rootSegmentIndex;
        this.resetState();
      }
      delete this._endpointStart;
      delete this._endpointEnd;
      delete this._endpointBwd;
      delete this._endpointSegmentIndex;
      delete this._endpointCleanupAction;
    }
  }

  handleDragStart(e, cursor) {}

  handleDrag(e, cursor) {
    this.handleNewPoint(e, cursor, true);
  }

  handleDragStop(e, cursor) {}

  handleNewPoint(e, cursor, dragging = false) {
    let title = 'Add point';
    // If we're not focusing on adding a point to an existing shape, start a new shape
    let frame = new HistoryFrame([], title);
    let path;
    let currentPointIndex;

    if (!this.pathItemCommitted) {
      // In this case we're starting a new path item
      path = new Path(this.editor.state.attributes.forType(Path));

      if (this.nextChildIndex === undefined) {
        this.nextChildIndex = this.editor.state.layer.nextChildIndex();
      }

      let pathIndex = this.nextChildIndex;

      this.rootSegmentIndex = pathIndex.concat([0]);
      this.currentPointIndex = this.rootSegmentIndex.concat([0]);

      frame.push(
        new actions.InsertAction({
          items: [{ item: path, index: pathIndex }]
        })
      );
    }

    let indexToSelect;

    if (this._endpointStart) {
      // Starting to draw from existing endpoint
      // Need to reverse segment so that we're continuing from the end
      if (this._endpointBwd) {
        frame.push(
          new actions.ReverseSegmentAction({
            index: this.rootSegmentIndex
          })
        );
      }

      // Need to upate sHandle and pHandle for the existing endpoint
      if (dragging && !cursor.posnCurrent.equal(cursor.posnDown)) {
        frame.push(
          new actions.AddHandleAction({
            index: this._endpointIndex,
            handle: 'sHandle',
            reflect: true,
            posn: cursor.posnCurrent
          })
        );
      }

      indexToSelect = this._endpointStart.index;

      title = 'Modify point';
    } else if (this._endpointEnd) {
      // Closing segment to existing endpoint
      // If we're closing on the same segment, then that's easy

      title = 'Close path';

      if (dragging) {
        frame.push(
          new actions.AddHandleAction({
            index: this._endpointIndex,
            handle: 'sHandle',
            reflect: true,
            posn: cursor.posnCurrent
          })
        );
      }

      this._endedPath = true;

      if (this._endpointEnd.segment.index.equal(this.rootSegmentIndex)) {
        // We are closing a single path (both points belong to it)
        frame.push(
          new actions.CloseSegmentAction({ index: this.rootSegmentIndex })
        );

        indexToSelect = this._endpointEnd.index;
      } else {
        // We are joining two different paths
        let removeIndex;

        // Copy endpoint's segment onto rootSegment

        let newSeg = this.editor.doc.getFromIndex(this._endpointSegmentIndex);

        if (this._endpointBwd) {
          newSeg = newSeg.clone();
          newSeg.reverse();
        }

        if (dragging) {
          newSeg.first.setSHandle(cursor.posnCurrent);
          newSeg.first.reflectHandle('sHandle');
        }

        let insertions = [];

        for (let i = 0; i < newSeg.length; i++) {
          insertions.push({
            index: this._segmentEndIndex.plus(i + 1),
            item: newSeg.points[i]
          });
        }

        frame.push(new actions.InsertAction({ items: insertions }));

        //indexToSelect = newSeg.first.index;

        frame.push(this._endpointCleanupAction);
      }
    } else {
      // Continuing to draw segment freely

      // Else, push an InsertAction with a new point
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
              index: this.currentPointIndex
            }
          ]
        })
      );

      indexToSelect = this.currentPointIndex;
    }

    frame.title = title;

    this.editor.perform(frame);

    if (indexToSelect) {
      this.editor.selectFromIndexes([indexToSelect]);
    } else {
      this.editor.selectItems([]);
    }
  }

  refresh(layer, context) {
    this.editor.cursorHandler.unregisterElement(/endpoint.*/);

    let proj = this.editor.projection;
    if (this.closest) {
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

    let handleEndpoint = pt => {
      let id = 'endpoint:' + pt.index.toString();
      let posn = proj.posn(pt);

      let elem = new Element(id, new Circle(posn, 5), {
        mouseover: e => {
          delete this.closest;
          e.stopPropagation();
        },
        mousedown: (e, cursor) => {
          if (!this.rootSegmentIndex) {
            this._endpointStart = pt;

            this._endpointIndex = pt.segment.index.concat([
              pt.segment.length - 1
            ]);
            this.rootSegmentIndex = pt.segment.index;

            this._endpointBwd = pt === pt.segment.first;
          } else {
            this._endpointEnd = pt;
            this._endpointSegmentIndex = pt.segment.index;
            this._endpointBwd = pt === pt.segment.last;

            this._segmentEndIndex = this.editor.doc.getFromIndex(
              this.rootSegmentIndex
            ).last.index;

            let alone = pt.segment.list.segments.length === 1;
            if (alone) {
              this._endpointCleanupAction = actions.RemoveAction.forItems([
                pt.segment.list.path
              ]);
            } else {
              this._endpointCleanupAction = actions.RemoveAction.forItems([
                pt.segment
              ]);
            }

            this._endpointIndex = pt.index;
          }

          this.pathItemCommitted = true;
          this.currentPointIndex = this._endpointIndex;
        },
        click: e => {
          e.stopPropagation();
        }
      });
      this.editor.cursorHandler.registerElement(elem);

      let r = 3.5;

      if (this.editor.cursorHandler.isActive(id)) {
        r += 2;
      }

      layer.drawCircle(posn, r, { stroke: consts.point, fill: 'white' });
    };

    for (let elem of this.editor.doc.elementsFlat) {
      if (elem.points) {
        for (let seg of elem.points.segments) {
          if (!seg.empty && !seg.closed) {
            handleEndpoint(seg.first);
            handleEndpoint(seg.last);
          }
        }
      }
    }
  }
}
