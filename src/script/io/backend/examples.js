import request from 'superagent';
import schema from 'proto/schema';
import bps from 'io/formats/bps';
import LocalBackend from 'io/backend/local';

class ExamplesBackend {
  constructor() {
    // x
  }

  async load(id) {
    // ExampleBackend loads a hard-coded file, but clones it as a LocalBackend file
    // x

    return new Promise((resolve, reject) => {
      var req = new XMLHttpRequest();
      req.open('GET', '/assets/bps/' + id + '.bps', true);
      req.responseType = 'arraybuffer';

      req.onload = function(e) {
        var arrayBuffer = req.response;
        if (arrayBuffer) {
          var bytes = new Uint8Array(arrayBuffer);
          let doc = bps.parse(bytes);
          // Clone to local backend
          doc.metadata = LocalBackend.assign(doc);
          resolve(doc);
        } else {
          reject('Error loading document');
        }
      };

      req.send(null);
    });
  }
}

export default new ExamplesBackend();
