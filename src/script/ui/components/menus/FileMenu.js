import MenuBody from 'ui/components/menus/MenuBody';
import MenuItem from 'ui/components/menus/MenuItem';
import MenuGroup from 'ui/components/menus/MenuGroup';
import Doc from 'io/doc';
import download from 'io/download';
import proto from 'proto/proto';

import bps from 'io/formats/bps';
import svg from 'io/formats/svg';

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

        // We read all files as bytes, and let the io/format libraries handle decoding that

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
        }

        if (doc) {
          this.props.openDoc(doc);
        }
      };

      reader.readAsArrayBuffer(files[0]);
    } else {
      console.warn('Failed to read files');
    }
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

                download.download(
                  this.props.editor.doc.name + '.bps',
                  bytes,
                  'image/svg+xml'
                );
              }}
            />
            Export source (BPS)
          </MenuItem>

          <MenuItem disabled={!this.props.editor.doc}>
            <a
              className="menu-item__cover"
              ref="downloadAnchor"
              onClick={() => {
                let str = svg.serialize(this.props.editor.doc);
                download.download(
                  this.props.editor.doc.name + '.svg',
                  str,
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
