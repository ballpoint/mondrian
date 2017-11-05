import proto from 'proto/proto';
import MenuBody from 'ui/components/menus/MenuBody';
import MenuItem from 'ui/components/menus/MenuItem';

class DebugMenu extends React.Component {
  protoRoundTrip() {
    let docProto = proto.serialize(this.props.editor.doc);
    console.log(docProto);
    let docParsed = proto.parse(docProto);
    console.log(docParsed);
    this.props.editor.open(docParsed);
  }

  render() {
    return (
      <MenuBody
        absoluteTop={this.props.absoluteTop}
        absoluteLeft={this.props.absoluteLeft}>
        <MenuItem
          label="Proto round-trip"
          action={this.protoRoundTrip.bind(this)}
        />
      </MenuBody>
    );
  }
}

export default DebugMenu;
