import Posn from 'geometry/posn';
import Group from 'geometry/group';

import Path from 'geometry/path';
import PointsList from 'geometry/points-list';
import PointsSegment from 'geometry/points-segment';
import PathPoint from 'geometry/path-point';

import Color from 'ui/color';
import { NONE } from 'ui/color';
import Index from 'geometry/index';

import { DocLocation } from 'io/backend/backend';
import Doc from 'io/doc';
import DocHistory from 'history/history';
import HistoryFrame from 'history/Frame';
import Layer from 'io/layer';

import schema from 'proto/schema';
import * as actions from 'history/actions/actions';

window.schema = schema;

const proto = {
  serialize(value) {
    if (value === undefined || value === null) return undefined;

    if (value instanceof Array) {
      return value.map(this.serialize.bind(this));
    }

    if (_.isPlainObject(value)) {
      let out = {};
      for (let key in value) {
        if (value.hasOwnProperty(key)) {
          out[key] = this.serialize(value[key]);
        }
      }
      return out;
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

    let d;

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
          children: value.children.map(this.serializeChild.bind(this))
        });

      // Document types

      case Layer:
        return schema.document.Layer.fromObject({
          id: value.id,
          children: value.children.map(this.serializeChild.bind(this))
        });

      case DocLocation:
        return schema.document.DocumentLocation.fromObject({
          backend: value.backend,
          path: value.path
        });

      case DocHistory:
        return schema.history.DocHistory.fromObject({
          frames: this.serialize(value.frames),
          currentIndex: value.currentIndex
        });

      case HistoryFrame:
        return schema.history.HistoryFrame.fromObject({
          actions: value.actions
            .map(action => {
              let ser = this.serialize(action);

              for (let field of schema.history.DocAction.oneofs.action
                .fieldsArray) {
                if (ser.$type.name === field.type) {
                  return schema.history.DocAction.fromObject({
                    [field.name]: ser
                  });
                }
              }

              console.error('Unable to parse action', value);

              return null;
            })
            .filter(action => {
              return action !== null;
            }),
          timestamp: Math.round(value.timestamp.valueOf() / 1000),
          id: value.id
        });

      case Doc:
        console.log(value.history);
        return schema.document.Document.fromObject({
          id: value.__id__,
          name: value.name,
          location: this.serialize(value.location),
          history: this.serialize(value.history),
          width: value.width,
          height: value.height,
          layers: this.serialize(value.layers)
        });

      // Actions
      case actions.InitAction:
        return schema.history.InitAction.fromObject({});

      case actions.NudgeAction:
        return schema.history.NudgeAction.fromObject(
          this.serialize(value.data)
        );

      case actions.ScaleAction:
        return schema.history.ScaleAction.fromObject(
          this.serialize(value.data)
        );

      case actions.RotateAction:
        return schema.history.RotateAction.fromObject(
          this.serialize(value.data)
        );

      case actions.NudgeHandleAction:
        d = this.serialize(value.data);
        d.handle = schema.geometry.Handle[value.data.handle];
        return schema.history.NudgeHandleAction.fromObject(d);

      case actions.AddHandleAction:
        d = this.serialize(value.data);
        d.handle = schema.geometry.Handle[value.data.handle];
        return schema.history.AddHandleAction.fromObject(d);

      case actions.RemoveHandleAction:
        d = this.serialize(value.data);
        d.handle = schema.geometry.Handle[value.data.handle];
        return schema.history.RemoveHandleAction.fromObject(d);

      case actions.InsertAction:
        d = {
          items: value.data.items.map(item => {
            return {
              index: this.serialize(item.index),
              item: this.serializeChild(item.item)
            };
          })
        };
        return schema.history.InsertAction.fromObject(d);

      default:
        console.error('proto serialize failed on:', value);
        throw new Error('Unable to serialize');
    }
  },

  serializeChild(child) {
    if (child instanceof Path) {
      return { pathItem: this.serialize(child) };
    } else if (child instanceof Group) {
      return { groupItem: this.serialize(child) };
    } else if (child instanceof Text) {
      return { textItem: this.serialize(child) };
    }
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
    if (value === undefined || value === null) return undefined;

    if (_.isPlainObject(value)) {
      let out = {};
      for (let key in value) {
        if (value.hasOwnProperty(key)) {
          out[key] = this.parse(value[key]);
        }
      }
      return out;
    }

    if (value instanceof Array) {
      return value.map(this.parse.bind(this));
    }

    if (this.isNative(value)) {
      return value;
    }

    let d;

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
        return null;

      // Document

      case schema.document.DocumentLocation:
        return new DocLocation({
          backend: value.backend,
          path: value.path
        });

      case schema.document.Layer:
        return new Layer({
          id: value.id,
          children: value.children.map(this.parseChild.bind(this))
        });

      case schema.document.Document:
        console.log(value.history);

        return new Doc({
          __id__: value.id,
          name: value.name,

          width: value.width,
          height: value.height,

          history: this.parse(value.history),
          location: this.parse(value.location),
          layers: this.parse(value.layers)
        });

      case schema.history.DocHistory:
        return new DocHistory(this.parse(value.frames), value.currentIndex);

      case schema.history.HistoryFrame:
        return HistoryFrame.fromObject({
          actions: this.parse(value.actions),
          id: value.id,
          timestamp: new Date(value.timestamp * 1000),
          committed: true
        });

      // Actions

      case schema.history.DocAction:
        // Wrapper
        return this.parse(value[value.action]);

      case schema.history.InitAction:
        return new actions.InitAction(this.parse(value.toJSON()));

      case schema.history.NudgeAction:
        return new actions.NudgeAction(this.parse(value.toJSON()));

      case schema.history.ScaleAction:
        return new actions.ScaleAction(this.parse(value.toJSON()));

      case schema.history.RotateAction:
        return new actions.RotateAction(this.parse(value.toJSON()));

      case schema.history.NudgeHandleAction:
        return new actions.NudgeHandleAction(this.parse(value.toJSON()));

      case schema.history.AddHandleAction:
        return new actions.AddHandleAction(this.parse(value.toJSON()));

      case schema.history.RemoveHandleAction:
        return new actions.RemoveHandleAction(this.parse(value.toJSON()));

      case schema.history.InsertAction:
        d = {
          items: value.items.map(item => {
            return {
              index: this.parse(item.index),
              item: this.parseChild(item.item)
            };
          })
        };
        return new actions.InsertAction(d);

      default:
        console.error('proto parse failed on:', value);
        throw new Error('Unable to parse');
    }
  },

  parseChild(child) {
    if (child.pathItem) {
      let data = {
        d: new PointsList(
          child.pathItem.points
            .filter(ps => {
              return !!ps.points;
            })
            .map(ps => {
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
      return new Group(
        child.groupItem.children.map(this.parseChild.bind(this))
      );
    }
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
    return _.isNumber(value) || _.isString(value) || _.isBoolean(value);
  }
};

export default proto;
