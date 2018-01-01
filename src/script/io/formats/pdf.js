import Path from 'geometry/path';
import Text from 'geometry/text';
import jsPDF from 'jspdf';

export default {
  serialize(doc) {
    let pdf = new jsPDF({
      unit: doc.unit,
      format: [doc.width, doc.height],
      orientation: doc.width > doc.height ? 'l' : 'p'
    });

    let elements = doc.elementsFlat;

    for (let elem of elements) {
      if (elem instanceof Path) {
        let { fill, stroke } = elem.data;
        let style = 'DF';
        if (fill.isNone && stroke.isNone) {
          continue;
        }
        if (fill.isNone) {
          style = 'S';
        } else if (stroke.isNone) {
          style = 'F';
        }

        if (!fill.isNone) {
          pdf.setFillColor(fill.r, fill.g, fill.b);
        }
        if (!stroke.isNone) {
          pdf.setDrawColor(stroke.r, stroke.g, stroke.b);
        }

        let segments = elem.points.segments.filter(seg => {
          return seg.length > 0;
        });

        for (let i = 0; i < segments.length; i++) {
          let seg = segments[i];
          let x = seg.points[0].x;
          let y = seg.points[0].y;
          let args = [];

          let lx = x;
          let ly = y;

          function pushPoint(point) {
            if (point.hasPHandle() || (point.prec && point.prec.hasSHandle())) {
              let p1x = point.x;
              let p1y = point.y;
              let p2x = point.x;
              let p3x = point.x;
              let p2y = point.y;
              let p3y = point.y;
              if (point.prec && point.prec.hasSHandle()) {
                p2x = point.prec.sHandle.x;
                p2y = point.prec.sHandle.y;
              }
              if (point.hasPHandle()) {
                p3x = point.pHandle.x;
                p3y = point.pHandle.y;
              }
              args.push([
                p2x - lx,
                p2y - ly,
                p3x - lx,
                p3y - ly,
                p1x - lx,
                p1y - ly
              ]);
            } else {
              args.push([point.x - lx, point.y - ly]);
            }
            lx = point.x;
            ly = point.y;
          }

          for (let point of seg.points.slice(1)) {
            pushPoint(point);
          }

          if (seg.closed) {
            pushPoint(seg.points[0]);
          }

          let st = null;

          if (i === segments.length - 1) {
            st = style;
          }

          pdf.lines(args, x, y, [1.0, 1.0], st, false);
        }
      } else if (elem instanceof Text) {
        let lines = elem.lines();

        // Convert px font size to pt
        let size = parseInt(elem.data['font-size'], 10);
        if (_.isNumber(size)) {
          size /= 3 / 4;
        } else {
          // Fall back to 12
          size = 12;
        }

        pdf.setFont(elem.fontFamily());
        pdf.setFontSize(size);
        pdf.setTextColor(elem.data.fill.r, elem.data.fill.g, elem.data.fill.b);

        for (let line of lines) {
          pdf.text(line.data.x, line.data.y, line.data.value);
        }
      }
    }

    // Return raw PDF code
    return pdf.output(undefined, {});
  }
};
