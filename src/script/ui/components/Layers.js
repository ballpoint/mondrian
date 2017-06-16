import Util from 'ui/components/Util';

let LayersUtil = React.createClass({
  render() {
    let doc = this.props.editor.doc;

    if (!doc) return null;

    return (
      <Util title="Layers">
        {doc.layers.length}
      </Util>
    );
  }
});

export default LayersUtil;

