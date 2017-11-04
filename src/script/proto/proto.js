import Posn from 'geometry/posn';
import PathPoint from 'geometry/path-point';
import schema from 'proto/schema';

const proto = {
  parse(value) {
    if (this.isNative(value)) {
      return value;
    }

    switch (value.$type) {
      case schema.geometry.Posn:
        return Posn.fromObject(value.$type.toObject(value));

      case schema.geometry.PathPoint:
        let vals = {
          x: value.base.x,
          y: value.base.y
        };

        if (value.pHandle) {
          vals.pX = value.pHandle.x;
          vals.pY = value.pHandle.y;
        }
        if (value.sHandle) {
          vals.sX = value.sHandle.x;
          vals.sY = value.sHandle.y;
        }

        console.log(value, vals);

        return PathPoint.fromObject(vals);

      default:
        console.error('Parse failed on:', value);
        throw new Error('Unable to parse');
    }
  },

  serialize(value) {
    switch (value.constructor) {
      case Posn:
        return schema.geometry.Posn.fromObject(value.toObject());

      case PathPoint:
        let obj = {
          base: schema.geometry.Posn.fromObject(value.toObject())
        };

        if (value.hasPHandle())
          obj.pHandle = schema.geometry.Posn.fromObject(
            value.pHandle.toObject()
          );
        if (value.hasSHandle())
          obj.sHandle = schema.geometry.Posn.fromObject(
            value.sHandle.toObject()
          );

        return schema.geometry.PathPoint.fromObject(obj);

      default:
        console.error('Serialize failed on:', value);
        throw new Error('Unable to serialize');
    }
  },

  isNative(value) {
    return _.isNumber(value) || _.isString(value);
  }
};

export default proto;
