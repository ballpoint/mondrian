import paper from 'paper';
import Path from 'geometry/path';
import _ from 'lodash';

// need to do this to initialize
new paper.Project();

export default function(a, b, op) {
  let ap = paper.PathItem.create(a.data.d);
  let bp = paper.PathItem.create(b.data.d);

  let result = ap[op](bp);

  let data = _.clone(bp.data);
  data.d = result.pathData;

  return new Path(data);
}
