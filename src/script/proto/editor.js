import proto from 'proto/proto';
import schema from 'proto/schema';
import Index from 'geometry/index';
import EditorState from 'ui/EditorState';
import Selection from 'ui/selection';
import DefaultAttributes from 'ui/DefaultAttributes';
import { toolsMapping } from 'ui/tools/tools';

const editorProto = {
  parseState(bytes, editor, doc) {
    let cachedState = schema.editor.EditorState.decode(bytes);

    let tool = new toolsMapping[
      schema.editor.nested.Tool.valuesById[cachedState.tool]
    ](editor);

    let attrs = {};
    for (let attr of cachedState.defaultAttributes) {
      attrs[attr.key] = proto.attributeValueFromObject(attr.value);
    }
    console.log('loaded', attrs.fill);

    return new EditorState(editor, doc, {
      position: proto.parse(cachedState.position),
      layer: doc.layers[0],
      zoomLevel: cachedState.zoomLevel,

      selection: new Selection(doc, []),
      hovering: new Selection(doc, []),

      scope: new Index([0]),
      attributes: new DefaultAttributes(attrs),

      tool
    });
  },

  serializeState(state, editor, doc) {
    let d = {
      position: proto.serialize(state.position),
      layer: proto.serialize(state.layer.index), // Serialize layer as its index
      zoomLevel: state.zoomLevel,
      selection: [], // TODO
      scope: proto.serialize(new Index([0])),
      tool: schema.editor.nested.Tool.values[state.tool.id],
      defaultAttributes: []
    };

    for (let key in state.attributes) {
      let val = state.attributes[key];
      d.defaultAttributes.push({
        key,
        value: proto.attributeValueAsObject(val)
      });
    }

    console.log(d.defaultAttributes);

    let msg = schema.editor.EditorState.fromObject(d);
    return msg.$type.encode(msg).finish();
  }
};

export default editorProto;
