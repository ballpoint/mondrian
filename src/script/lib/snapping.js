import LineSegment from 'geometry/line-segment';
// Snapping utils

export const degs_45_90 = [0, 45, 90, 135, 180, 225, 270, 315, 360];
export const degs_45 = [45, 135, 225, 315];

export default {
  toDegs(origin, posn, degs = degs_45_90) {
    // Snap to 45 deg
    let a = new LineSegment(origin, posn).angle360;

    for (let deg of degs) {
      let min = deg - 45 / 2;
      let max = deg + 45 / 2;

      let matches = false;
      if (min < 0 && a >= 360 - 45) {
        matches = a - 360 > min && a - 360 < max;
      } else {
        matches = a > min && a < max;
      }

      if (matches) {
        // Found the correct snapping angle
        switch (deg) {
          case 0:
          case 180:
            posn.x = origin.x;
            break;
          case 90:
          case 270:
            posn.y = origin.y;
            break;
          default:
            let d = posn.distanceFrom(origin);
            let xp = origin
              .clone()
              .nudge(0, -d * 2)
              .rotate(deg, origin);
            let xls = new LineSegment(origin, xp);
            posn = xls.closestPosn(posn);
        }

        return posn;

        break;
      }
    }
  }
};
