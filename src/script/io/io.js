import bps from 'io/formats/bps';
import svg from 'io/formats/svg';

const io = {
  parseNativeFile(file) {
    let reader = new FileReader();
    let fn = file.name;

    return new Promise(function(resolve, reject) {
      reader.onload = e => {
        let doc;

        // We read all files as bytes, and let the io/format libraries handle parsing

        let buffer = reader.result;
        let bytes = new Uint8Array(buffer);

        let ext = fn
          .split('.')
          .last()
          .toLowerCase();

        switch (ext) {
          case 'bps':
            if (bps.headerValid(bytes)) {
              doc = bps.parse(bytes, fn);
            }
            break;
          case 'svg':
            doc = svg.parse(bytes, fn);
            break;
          default:
            reject('Unsupported file type');
        }

        resolve(doc);
      };

      // Start reading, do the rest of the work in the callback
      reader.readAsArrayBuffer(file);
    });
  }
};

export default io;
