import proto from 'proto/proto';
import schema from 'proto/schema';
import localForage from 'localforage';

let store = localForage.createInstance({ name: 'editor' });

export default {
  async write(items) {
    console.log(items);
    console.log(proto.serialize(items));

    let msg = schema.editor.Clipboard.fromObject({
      items: items.map(item => {
        return proto.serializeItem(item);
      })
    });

    let bytes = schema.editor.Clipboard.encode(msg).finish();

    console.log(bytes);
    store.setItem('clipboard', bytes);
  },

  async read() {
    let bytes = await store.getItem('clipboard');
    console.log(bytes);

    let msg = schema.editor.Clipboard.decode(bytes);
    return msg.items.map(item => {
      return proto.parseItem(item);
    });
  }
};
