import Posn from 'geometry/posn';
import Group from 'geometry/group';

import Path from 'geometry/path';
import PointsList from 'geometry/points-list';
import PointsSegment from 'geometry/points-segment';
import PathPoint from 'geometry/path-point';

import Text from 'geometry/text';

import Color from 'ui/color';
import Index from 'geometry/index';

import DocMetadata from 'io/backend/metadata';
import Doc from 'io/doc';
import Layer from 'io/layer';
import DocHistory from 'history/history';
import Selection from 'ui/selection';

import * as tools from 'ui/tools/tools';

import HistoryFrame from 'history/Frame';
import * as actions from 'history/actions/actions';

import schema from 'proto/schema';

window.schema = schema;

// Handles serializing and parsing objects (mostly documents) using protobuf format

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
    if (value.isNone) {
      return schema.document.Color.fromObject({
        none: true
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
          obj.pHandle = schema.geometry.Posn.fromObject(value.pHandle.toObject());
        if (value.hasSHandle())
          obj.sHandle = schema.geometry.Posn.fromObject(value.sHandle.toObject());

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
          none: value.isNone
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

      case Text:
        return schema.document.TextItem.fromObject({
          style: this.serializeItemStyle(value),
          metadata: this.serializeItemMetadata(value.metadata),
          attrs: this.serialize({
            origin: new Posn(value.data.x, value.data.y),
            value: value.data.value,
            width: value.data.width,
            height: value.data.height,
            lineHeight: value.data['line-height'],
            fontSize: value.data['font-size'],
            fontFamily: value.data['font-family'],
            alignHorizontal: schema.document.nested.TextAlignHorizonal.values[value.data.align],
            alignVertical: schema.document.nested.TextAlignVertical.values[value.data.valign]
          })
        });

      case Group:
        return schema.document.GroupItem.fromObject({
          children: value.children.map(this.serializeItem.bind(this)),
          metadata: this.serializeItemMetadata(value.metadata)
        });

      // Document types

      case Layer:
        return schema.document.Layer.fromObject({
          id: value.id,
          children: value.children.map(this.serializeItem.bind(this))
        });

      case DocHistory:
        return schema.history.DocumentHistory.fromObject({
          frames: this.serialize(value.frames),
          currentIndex: value.currentIndex
        });

      case HistoryFrame:
        return schema.history.HistoryFrame.fromObject({
          actions: value.actions
            .map((action) => {
              let ser = this.serialize(action);

              for (let field of schema.history.DocAction.oneofs.action.fieldsArray) {
                if (ser.$type.name === field.type) {
                  return schema.history.DocAction.fromObject({
                    [field.name]: ser
                  });
                }
              }

              console.error('Unable to parse action', value);

              return null;
            })
            .filter((action) => {
              return action !== null;
            }),
          timestamp: Math.round(value.timestamp.valueOf() / 1000),
          id: value.id
        });

      case Doc:
        return schema.document.Document.fromObject({
          name: value.name,
          history: this.serialize(value.history),
          width: value.width,
          height: value.height,

          media: schema.document.nested.DocumentMedia.values[value.media],

          printUnit: schema.document.nested.DocumentPrintUnit.values[value.printUnit],
          layers: this.serialize(value.layers),
          state: this.serialize(value.state)
        });

      // Actions
      case actions.InitAction:
        return schema.history.InitAction.fromObject({});

      case actions.NudgeAction:
        return schema.history.NudgeAction.fromObject(this.serialize(value.data));

      case actions.ScaleAction:
        return schema.history.ScaleAction.fromObject(this.serialize(value.data));

      case actions.RotateAction:
        return schema.history.RotateAction.fromObject(this.serialize(value.data));

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
          items: value.data.items.map((item) => {
            return {
              index: this.serialize(item.index),
              item: this.serializeItem(item.item)
            };
          })
        };
        return schema.history.InsertAction.fromObject(d);

      case actions.RemoveAction:
        d = {
          items: value.data.items.map((item) => {
            return {
              index: this.serialize(item.index),
              item: this.serializeItem(item.item)
            };
          })
        };
        return schema.history.RemoveAction.fromObject(d);

      case actions.ShiftSegmentAction:
        return schema.history.ShiftSegmentAction.fromObject(this.serialize(value.data));

      case actions.ReverseSegmentAction:
        return schema.history.ReverseSegmentAction.fromObject(this.serialize(value.data));

      case actions.CloseSegmentAction:
        return schema.history.CloseSegmentAction.fromObject(this.serialize(value.data));

      case actions.OpenSegmentAction:
        return schema.history.OpenSegmentAction.fromObject(this.serialize(value.data));

      // Group/Ungroup
      case actions.GroupAction:
        return schema.history.GroupAction.fromObject(this.serialize(value.data));

      case actions.UngroupAction:
        return schema.history.UngroupAction.fromObject(this.serialize(value.data));

      case actions.SplitPathAction:
        return schema.history.SplitPathAction.fromObject(this.serialize(value.data));

      case actions.UnsplitPathAction:
        return schema.history.UnsplitPathAction.fromObject(this.serialize(value.data));

      case actions.ToggleMetadataBoolAction:
        return schema.history.ToggleMetadataBoolAction.fromObject(this.serialize(value.data));

      case actions.SetDocDimensionsAction:
        return schema.history.SetDocDimensionsAction.fromObject(this.serialize(value.data));

      case actions.SetDocNameAction:
        return schema.history.SetDocNameAction.fromObject(this.serialize(value.data));

      case actions.SetAttributeAction:
        d = {
          key: value.data.key,
          items: value.data.items.map((item) => {
            return {
              index: this.serialize(item.index),
              value: this.attributeValueAsObject(item.value),
              oldValue: this.attributeValueAsObject(item.oldValue)
            };
          })
        };
        return schema.history.SetAttributeAction.fromObject(d);

      case actions.ShiftIndexAction:
        d = {
          items: value.data.items.map((item) => {
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

  serializeItem(child) {
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
      strokeLineCap: schema.document.StrokeLineCap[value.data['stroke-linecap']],
      strokeLineJoin: schema.document.StrokeLineJoin[value.data['stroke-linejoin']],
      strokeWidth: value.data['stroke-width'],
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

  attributeValueAsObject(value) {
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
        if (value.none) return Color.none();
        return new Color(value.r, value.g, value.b, value.a);

      case schema.document.Item:
        return this.parseItem(value);

      // Document

      case schema.document.Layer:
        return new Layer({
          id: value.id,
          children: value.children.map(this.parseItem.bind(this))
        });

      case schema.document.Document:
        let doc = new Doc({
          name: value.name,

          width: value.width,
          height: value.height,

          printUnit: schema.document.nested.DocumentPrintUnit.valuesById[value.printUnit],

          media: schema.document.nested.DocumentMedia.valuesById[value.media],

          history: this.parse(value.history),
          layers: this.parse(value.layers)
        });

        return doc;

      case schema.history.DocumentHistory:
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
        d = this.parse(this.asObject(value));
        d.handle = schema.geometry.nested.Handle.valuesById[value.handle];
        return new actions.NudgeHandleAction(d);

      case schema.history.AddHandleAction:
        d = this.parse(this.asObject(value));
        d.handle = schema.geometry.nested.Handle.valuesById[value.handle];
        return new actions.AddHandleAction(d);

      case schema.history.RemoveHandleAction:
        d = this.parse(this.asObject(value));
        d.handle = schema.geometry.nested.Handle.valuesById[value.handle];
        return new actions.RemoveHandleAction(d);

      case schema.history.InsertAction:
        d = {
          items: value.items
            .filter((item) => {
              return !!item.item;
            })
            .map((item) => {
              return {
                index: this.parse(item.index),
                item: this.parseItem(item.item)
              };
            })
        };
        return new actions.InsertAction(d);

      case schema.history.RemoveAction:
        d = {
          items: value.items
            .filter((item) => {
              return !!item.item;
            })
            .map((item) => {
              return {
                index: this.parse(item.index),
                item: this.parseItem(item.item)
              };
            })
        };
        return new actions.RemoveAction(d);

      case schema.history.ShiftSegmentAction:
        return new actions.RemoveHandleAction(this.parse(this.asObject(value)));

      case schema.history.ReverseSegmentAction:
        return new actions.ReverseSegmentAction(this.parse(this.asObject(value)));

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
        return new actions.ToggleMetadataBoolAction(this.parse(this.asObject(value)));

      case schema.history.SetDocDimensionsAction:
        return new actions.SetDocDimensionsAction(this.parse(this.asObject(value)));

      case schema.history.SetDocNameAction:
        return new actions.SetDocNameAction(this.parse(this.asObject(value)));

      case schema.history.SetAttributeAction:
        d = {
          key: value.key,
          items: value.items.map((item) => {
            return {
              index: this.parse(item.index),
              value: this.attributeValueFromObject(item.value),
              oldValue: this.attributeValueFromObject(item.oldValue)
            };
          })
        };
        return new actions.SetAttributeAction(d);

      case schema.history.ShiftIndexAction:
        d = {
          items: value.items.map((item) => {
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

  parseItem(child) {
    if (child.pathItem) {
      let data = {
        d: new PointsList(
          child.pathItem.points
            .filter((ps) => {
              return !!ps.points;
            })
            .map((ps) => {
              let segment = new PointsSegment(
                ps.points.map((p) => {
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
      let data = {
        x: child.textItem.attrs.origin.x,
        y: child.textItem.attrs.origin.y,
        width: child.textItem.attrs.width,
        height: child.textItem.attrs.height,
        'line-height': child.textItem.attrs.lineHeight,
        'font-size': child.textItem.attrs.fontSize,
        'font-family': child.textItem.attrs.fontFamily,
        align:
          schema.document.nested.TextAlignHorizonal.valuesById[
            child.textItem.attrs.alignHorizontal
          ],
        valign:
          schema.document.nested.TextAlignVertical.valuesById[child.textItem.attrs.alignVertical],

        value: child.textItem.attrs.value
      };

      _.extend(data, this.parseItemStyle(child.textItem.style));

      return new Text(data, this.parseItemMetadata(child.textItem.metadata));
    } else if (child.groupItem) {
      return new Group(
        child.groupItem.children.map(this.parseItem.bind(this)),
        this.parseItemMetadata(child.groupItem.metadata)
      );
    }
  },

  parseItemStyle(style) {
    return {
      fill: this.parse(style.fill),
      stroke: this.parse(style.stroke),
      'stroke-linecap': schema.document.nested.StrokeLineCap.valuesById[style.strokeLineCap],
      'stroke-linejoin': schema.document.nested.StrokeLineJoin.valuesById[style.strokeLineJoin],
      'stroke-width': style.strokeWidth,
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

  attributeValueFromObject(value) {
    return this.parse(value[value.value]);
  },

  isNative(value) {
    return _.isNumber(value) || _.isString(value) || _.isBoolean(value);
  }
};

export default proto;
