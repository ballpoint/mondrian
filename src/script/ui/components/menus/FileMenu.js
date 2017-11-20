import MenuBody from 'ui/components/menus/MenuBody';
import MenuItem from 'ui/components/menus/MenuItem';
import MenuGroup from 'ui/components/menus/MenuGroup';
import Doc from 'io/doc';
import download from 'io/download';
import proto from 'proto/proto';
import bps from 'io/formats/bps';
import 'menus/file-menu.scss';

class FileMenu extends React.Component {
  openFile = e => {
    e = e.nativeEvent || e;

    let files = e.target.files;
    if (files) {
      let reader = new FileReader();
      let fn = files[0].name;

      reader.onload = e => {
        let doc;

        let buffer = reader.result;
        let bytes = new Uint8Array(buffer);

        if (bps.headerValid(bytes)) {
          console.info('decoding as BPS', bytes);
          doc = bps.parse(bytes);
        } else {
          let dec = new TextDecoder('utf-8');
          let text = dec.decode(bytes);
          doc = Doc.fromSVG(text, fn.split('.')[0]);
        }

        this.props.openDoc(doc);
      };

      reader.readAsArrayBuffer(files[0]);
    } else {
      console.warn('Failed to read files');
    }
  };

  docSVGHref = () => {
    return (
      'data:image/svg+xml;charset=utf-8;base64,' +
      btoa(this.props.editor.doc.toSVG())
    );
  };

  render() {
    return (
      <MenuBody
        absoluteTop={this.props.absoluteTop}
        absoluteLeft={this.props.absoluteLeft}>
        <MenuGroup>
          <MenuItem label="New..." hotkey="Ctrl-N" action={this.props.newDoc} />

          <MenuItem className="menu-item--file-input" hotkey="Ctrl-O">
            <input ref="fileInput" type="file" onChange={this.openFile} />
            Open...
          </MenuItem>
        </MenuGroup>
        <MenuGroup>
          <MenuItem disabled={!this.props.editor.doc}>
            <a
              className="menu-item__cover"
              ref="downloadAnchor"
              onClick={() => {
                let bytes = bps.serialize(this.props.editor.doc);

                console.log(bytes);

                download.download(this.props.editor.doc.name + '.bps', bytes);
              }}
            />
            Export source (BPS)
          </MenuItem>

          <MenuItem disabled={!this.props.editor.doc}>
            <a
              className="menu-item__cover"
              ref="downloadAnchor"
              onClick={() => {
                download.download(
                  this.props.editor.doc.name + '.svg',
                  this.props.editor.doc.toSVG(),
                  'image/svg+xml'
                );
              }}
            />
            Export as SVG
          </MenuItem>
        </MenuGroup>
      </MenuBody>
    );
  }
}

export default FileMenu;
