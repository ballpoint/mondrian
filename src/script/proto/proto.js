import Posn from 'geometry/posn';
import Group from 'geometry/group';

import Path from 'geometry/path';
import PointsList from 'geometry/points-list';
import PointsSegment from 'geometry/points-segment';
import PathPoint from 'geometry/path-point';

import Color from 'ui/color';
import { NONE } from 'ui/color';
import Index from 'geometry/index';

import { DocLocation } from 'io/doc';
import Doc from 'io/doc';
import Layer from 'io/layer';

import schema from 'proto/schema';

window.schema = schema;

const proto = {
  serialize(value) {
    if (value instanceof Array) {
      return value.map(this.serialize.bind(this));
    }

    // I dislike this:
    if (value === NONE) {
      return schema.document.Color.fromObject({
        isNone: true
      });
    }

    if (this.isNative(value)) {
      return value;
    }

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

      case Index:
        return schema.document.Index.fromObject({
          parts: value.parts
        });

      case Color:
        return schema.document.Color.fromObject({
          r: value.r,
          g: value.g,
          b: value.b,
          a: value.a,
          isNone: value === NONE
        });

      // Item types

      case PointsSegment:
        return schema.geometry.PointsSegment.fromObject({
          points: this.serialize(value.points),
          closed: value.closed
        });

      case Path:
        return schema.document.PathItem.fromObject({
          style: this.serializeItemStyle(value),
          points: this.serialize(value.points.segments)
        });

      case Group:
        return schema.document.GroupItem.fromObject({
          children: this.serializeChildren(value.children)
        });

      // Document types

      case Layer:
        return schema.document.Layer.fromObject({
          id: value.id,
          children: this.serializeChildren(value.children)
        });

      case DocLocation:
        return schema.document.DocumentLocation.fromObject({
          backend: value.backend,
          path: value.path
        });

      case Doc:
        return schema.document.Document.fromObject({
          id: value.__id__,
          location: this.serialize(value.location),
          width: value.width,
          height: value.height,
          layers: this.serialize(value.layers)
        });

      default:
        console.error('proto serialize failed on:', value);
        throw new Error('Unable to serialize');
    }
  },

  serializeChildren(children) {
    return children.map(child => {
      if (child instanceof Path) {
        return { pathItem: this.serialize(child) };
      } else if (child instanceof Group) {
        return { groupItem: this.serialize(child) };
      } else if (child instanceof Text) {
        return { textItem: this.serialize(child) };
      }
    });
  },

  serializeItemStyle(value) {
    return {
      fill: this.serialize(value.data.fill),
      stroke: this.serialize(value.data.stroke),
      strokeLineCap: schema.document.StrokeLineCap[value.data.strokeLineCap],
      strokeLineJoin: schema.document.StrokeLineJoin[value.data.strokeLineJoin],
      opacity: 1.0
    };
  },

  parse(value) {
    if (value instanceof Array) {
      return value.map(this.parse.bind(this));
    }

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

        return PathPoint.fromObject(vals);

      case schema.document.Index:
        return new Index(value.parts);

      case schema.document.Color:
        if (value.isNone) return NONE;
        return new Color(value.r, value.g, value.b, value.a);

      case schema.document.Item:

      // Document

      case schema.document.DocumentLocation:
        return new DocLocation({
          backend: value.backend,
          path: value.path
        });

      case schema.document.Layer:
        return new Layer({
          id: value.id,
          children: this.parseChildren(value.children)
        });

      case schema.document.Document:
        return new Doc({
          __id__: value.id,
          name: value.name,

          width: value.width,
          height: value.height,

          location: this.parse(value.location),
          layers: this.parse(value.layers)
        });

      default:
        console.error('proto parse failed on:', value);
        throw new Error('Unable to parse');
    }
  },

  parseChildren(children) {
    return children.map(child => {
      if (child.pathItem) {
        let data = {
          d: new PointsList(
            child.pathItem.points.map(ps => {
              let segment = new PointsSegment(
                ps.points.map(p => {
                  return this.parse(p);
                })
              );

              if (ps.closed) segment.close();

              return segment;
            })
          )
        };

        _.extend(data, this.parseItemStyle(child.pathItem.style));

        return new Path(data);
      } else if (child.textItem) {
        return null;
      } else if (child.groupItem) {
        return new Group(this.parseChildren(child.groupItem.children));
      }
    });
  },

  parseItemStyle(style) {
    return {
      fill: this.parse(style.fill),
      stroke: this.parse(style.stroke),
      strokeLineCap: 'butt',
      strokeLineJoin: 'miter'
    };
  },

  isNative(value) {
    return _.isNumber(value) || _.isString(value);
  }
};

export default proto;
