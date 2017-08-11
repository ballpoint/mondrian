import PathPoint from 'geometry/path-point';

export default {
  getNoun(items) {
    let noun;
    if (items[0] instanceof PathPoint) {
      noun = 'point';
    } else {
      noun = 'item';
    }

    if (items.length > 1) {
      return noun + 's';
    } else {
      return noun;
    }
  }
};
