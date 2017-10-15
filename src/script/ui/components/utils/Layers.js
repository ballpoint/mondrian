import Util from 'ui/components/utils/Util';

class LayersUtil extends React.Component {
  render() {
    let doc = this.props.editor.doc;

    if (!doc) return null;

    return (
      <Util title="Layers">
        {doc.children.length} layers
      </Util>
    );
  }
}

export default LayersUtil;
