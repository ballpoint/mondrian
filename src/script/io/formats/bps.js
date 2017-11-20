// BPS
// BallPoint Source file
// Our binary file format, composed of a header and protobuf-encoded document body

// Magic number: !BPS (33 66 80 83)

import proto from 'proto/proto';
import schema from 'proto/schema';

const BPS_HEADER = new Uint8Array([33, 66, 80, 83]);

export default {
  serialize(doc) {
    let msg = proto.serialize(doc);
    let bytes = msg.$type.encode(msg).finish();

    let wh = new Uint8Array(bytes.length + 4);

    // Write header at beginning of file
    wh.set(BPS_HEADER);

    // Write body of file
    wh.set(bytes, 4);

    return wh;
  },

  parse(bytes) {
    if (!this.headerValid(bytes)) {
      throw new Error('Unable to parse as PBS: header mismatch at index ' + i);
    }

    let body = bytes.slice(4);

    let docMessage = schema.document.Document.decode(body);
    let doc = proto.parse(docMessage);

    return doc;
  },

  headerValid(bytes) {
    for (let i = 0; i < 4; i++) {
      if (bytes[i] !== BPS_HEADER[i]) {
        return false;
      }
    }

    return true;
  }
};
