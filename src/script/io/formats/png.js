import Layer from 'ui/layer';
import Projection from 'ui/projection';

export default {
  async serialize(doc) {
    let canvas = document.createElement('canvas');

    let { width, height } = doc;

    canvas.width = width * 2;
    canvas.height = height * 2;
    let layer = new Layer('out', canvas);

    let projection = Projection.simple(width, height, 2.0);

    for (let elem of doc.elementsFlat) {
      elem.drawToCanvas(layer, layer.context, projection);
    }

    return new Promise(function(resolve, reject) {
      canvas.toBlob(blob => {
        resolve(blob);
      }, 'image/png');
    });
  }
};
