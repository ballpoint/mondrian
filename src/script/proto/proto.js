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
          metadata: this.serializeItemMetadata(value.metadata),
          points: this.serialize(value.points.segments)
        });

      case Group:
        return schema.document.GroupItem.fromObject({
          children: value.children.map(this.serializeChild.bind(this)),
          metadata: this.serializeItemMetadata(value.metadata)
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

      case actions.RemoveAction:
        d = {
          items: value.data.items.map(item => {
            return {
              index: this.serialize(item.index),
              item: this.serializeChild(item.item)
            };
          })
        };
        return schema.history.RemoveAction.fromObject(d);

      case actions.ShiftSegmentAction:
        return schema.history.ShiftSegmentAction.fromObject(
          this.serialize(value.data)
        );

      case actions.ReverseSegmentAction:
        return schema.history.ReverseSegmentAction.fromObject(
          this.serialize(value.data)
        );

      case actions.CloseSegmentAction:
        return schema.history.CloseSegmentAction.fromObject(
          this.serialize(value.data)
        );

      case actions.OpenSegmentAction:
        return schema.history.OpenSegmentAction.fromObject(
          this.serialize(value.data)
        );

      // Group/Ungroup
      case actions.GroupAction:
        return schema.history.GroupAction.fromObject(
          this.serialize(value.data)
        );

      case actions.UngroupAction:
        return schema.history.UngroupAction.fromObject(
          this.serialize(value.data)
        );

      case actions.SplitPathAction:
        return schema.history.SplitPathAction.fromObject(
          this.serialize(value.data)
        );

      case actions.UnsplitPathAction:
        return schema.history.UnsplitPathAction.fromObject(
          this.serialize(value.data)
        );

      case actions.ToggleMetadataBoolAction:
        return schema.history.ToggleMetadataBoolAction.fromObject(
          this.serialize(value.data)
        );

      case actions.SetDocDimensionsAction:
        return schema.history.SetDocDimensionsAction.fromObject(
          this.serialize(value.data)
        );

      case actions.SetDocNameAction:
        return schema.history.SetDocNameAction.fromObject(
          this.serialize(value.data)
        );

      case actions.SetAttributeAction:
        d = {
          key: value.data.key,
          items: value.data.items.map(item => {
            return {
              index: this.serialize(item.index),
              value: this.serializeAttrValue(item.value),
              oldValue: this.serializeAttrValue(item.oldValue)
            };
          })
        };
        return schema.history.SetAttributeAction.fromObject(d);

      case actions.ShiftIndexAction:
        d = {
          items: value.data.items.map(item => {
            return schema.history.ShiftIndexAction.ItemIndexDelta.fromObject({
              index: this.serialize(item.index),
              delta: item.delta
            });
          })
        };

        return schema.history.ShiftIndexAction.fromObject(d);

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
    } else if (child instanceof PathPoint) {
      return { pathPoint: this.serialize(child) };
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

  serializeItemMetadata(metadata) {
    return {
      locked: metadata.locked,
      visible: metadata.visible,
      angle: metadata.angle
    };
  },

  serializeAttrValue(value) {
    // Type-free language, meet strictly-typed serialization format
    if (_.isNumber(value)) {
      if (value % 1 == 0) {
        return { intValue: value };
      } else {
        return { floatValue: value };
      }
    } else if (_.isString(value)) {
      return { stringValue: value };
    } else if (value instanceof Color) {
      return { colorValue: this.serialize(value) };
    }
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
        return new actions.InitAction(this.parse(this.asObject(value)));

      case schema.history.NudgeAction:
        return new actions.NudgeAction(this.parse(this.asObject(value)));

      case schema.history.ScaleAction:
        return new actions.ScaleAction(this.parse(this.asObject(value)));

      case schema.history.RotateAction:
        return new actions.RotateAction(this.parse(this.asObject(value)));

      case schema.history.NudgeHandleAction:
        return new actions.NudgeHandleAction(this.parse(this.asObject(value)));

      case schema.history.AddHandleAction:
        return new actions.AddHandleAction(this.parse(this.asObject(value)));

      case schema.history.RemoveHandleAction:
        return new actions.RemoveHandleAction(this.parse(this.asObject(value)));

      case schema.history.InsertAction:
        d = {
          items: value.items
            .filter(item => {
              return !!item.item;
            })
            .map(item => {
              return {
                index: this.parse(item.index),
                item: this.parseChild(item.item)
              };
            })
        };
        return new actions.InsertAction(d);

      case schema.history.RemoveAction:
        d = {
          items: value.items
            .filter(item => {
              return !!item.item;
            })
            .map(item => {
              return {
                index: this.parse(item.index),
                item: this.parseChild(item.item)
              };
            })
        };
        return new actions.RemoveAction(d);

      case schema.history.ShiftSegmentAction:
        return new actions.RemoveHandleAction(this.parse(this.asObject(value)));

      case schema.history.ReverseSegmentAction:
        return new actions.ReverseSegmentAction(
          this.parse(this.asObject(value))
        );

      case schema.history.CloseSegmentAction:
        return new actions.CloseSegmentAction(this.parse(this.asObject(value)));

      case schema.history.OpenSegmentAction:
        return new actions.RemoveHandleAction(this.parse(this.asObject(value)));

      // Group/Ungroup
      case schema.history.GroupAction:
        return new actions.GroupAction(this.parse(this.asObject(value)));

      case schema.history.UngroupAction:
        return new actions.UngroupAction(this.parse(this.asObject(value)));

      case schema.history.SplitPathAction:
        return new actions.SplitPathAction(this.parse(this.asObject(value)));

      case schema.history.UnsplitPathAction:
        return new actions.UnsplitPathAction(this.parse(this.asObject(value)));

      case schema.history.ToggleMetadataBoolAction:
        return new actions.ToggleMetadataBoolAction(
          this.parse(this.asObject(value))
        );

      case schema.history.SetDocDimensionsAction:
        return new actions.SetDocDimensionsAction(
          this.parse(this.asObject(value))
        );

      case schema.history.SetDocNameAction:
        return new actions.SetDocNameAction(this.parse(this.asObject(value)));

      case schema.history.SetAttributeAction:
        d = {
          key: value.key,
          items: value.items.map(item => {
            return {
              index: this.parse(item.index),
              value: this.parseAttrValue(item.value),
              oldValue: this.parseAttrValue(item.oldValue)
            };
          })
        };
        return new actions.SetAttributeAction(d);

      case schema.history.ShiftIndexAction:
        d = {
          items: value.items.map(item => {
            return {
              index: this.parse(item.index),
              delta: item.delta
            };
          })
        };

        return new actions.ShiftIndexAction(d);

      default:
        console.error('proto parse failed on:', value);
        throw new Error('Unable to parse');
    }
  },

  asObject(value) {
    let obj = {};
    for (let key in value.$type.fields) {
      obj[key] = value[key];
    }
    return obj;
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

      return new Path(data, this.parseItemMetadata(child.pathItem.metadata));
    } else if (child.pathPoint) {
      return this.parse(child.pathPoint);
    } else if (child.textItem) {
      // TODO
      return null;
    } else if (child.groupItem) {
      return new Group(
        child.groupItem.children.map(this.parseChild.bind(this)),
        this.parseItemMetadata(child.groupItem.metadata)
      );
    }
  },

  parseItemStyle(style) {
    return {
      fill: this.parse(style.fill),
      stroke: this.parse(style.stroke),
      strokeLineCap: 'butt',
      strokeLineJoin: 'miter',
      opacity: style.opacity
    };
  },

  parseItemMetadata(metadata) {
    return {
      locked: metadata.locked,
      visible: metadata.visible,
      angle: metadata.angle
    };
  },

  parseAttrValue(value) {
    if (value.stringValue) {
      return value.stringValue;
    } else if (value.intValue) {
      return value.intValue;
    } else if (value.floatValue) {
      return value.floatValue;
    } else if (value.colorValue) {
      return this.parse(value.colorValue);
    }
  },

  isNative(value) {
    return _.isNumber(value) || _.isString(value) || _.isBoolean(value);
  }
};

export default proto;
