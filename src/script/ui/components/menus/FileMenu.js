import MenuBody from 'ui/components/menus/MenuBody';
import MenuItem from 'ui/components/menus/MenuItem';
import MenuGroup from 'ui/components/menus/MenuGroup';
import Doc from 'io/doc';
import download from 'io/download';
import proto from 'proto/proto';

import io from 'io/io';
import bps from 'io/formats/bps';
import svg from 'io/formats/svg';
import pdf from 'io/formats/pdf';
import png from 'io/formats/png';

import 'menus/file-menu.scss';

class FileMenu extends React.Component {
  importFile(e) {
    e = e.nativeEvent || e;
    let file = e.target.files[0];
    this.props.importNativeFile(file);
  }

  render() {
    return (
      <MenuBody
        absoluteTop={this.props.absoluteTop}
        absoluteLeft={this.props.absoluteLeft}>
        <MenuGroup>
          <MenuItem
            label="New..."
            action={() => {
              this.props.newDoc();
              this.props.close();
            }}
          />

          <MenuItem label="Open..." hotkey="Ctrl-O" href="/files" />
        </MenuGroup>
        <MenuGroup>
          <MenuItem className="menu-item--file-input" hotkey="Ctrl-I">
            <input
              ref="fileInput"
              type="file"
              onChange={this.importFile.bind(this)}
            />
            Import file...
          </MenuItem>

          <MenuItem
            disabled={!this.props.editor.doc}
            ref="downloadAnchor"
            action={() => {
              let bytes = bps.serialize(this.props.editor.doc);

              download.download(
                this.props.editor.doc.name + '.bps',
                bytes,
                'image/svg+xml'
              );
            }}>
            Export source (BPS)
          </MenuItem>

          <MenuItem
            disabled={!this.props.editor.doc}
            ref="downloadAnchor"
            action={() => {
              let str = svg.serialize(this.props.editor.doc);
              download.download(
                this.props.editor.doc.name + '.svg',
                str,
                'image/svg+xml'
              );
            }}>
            Export as SVG
          </MenuItem>

          <MenuItem
            disabled={!this.props.editor.doc}
            ref="downloadAnchor"
            action={() => {
              let str = pdf.serialize(this.props.editor.doc);
              download.download(
                this.props.editor.doc.name + '.pdf',
                str,
                'application/pdf'
              );
            }}>
            Export as PDF
          </MenuItem>

          <MenuItem
            disabled={!this.props.editor.doc}
            ref="downloadAnchor"
            action={async () => {
              let str = await png.serialize(this.props.editor.doc);
              download.download(
                this.props.editor.doc.name + '.png',
                str,
                'image/png'
              );
            }}>
            Export as PNG
          </MenuItem>
        </MenuGroup>
      </MenuBody>
    );
  }
}

export default FileMenu;
