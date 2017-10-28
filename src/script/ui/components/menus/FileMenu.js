import MenuBody from 'ui/components/menus/MenuBody';
import MenuItem from 'ui/components/menus/MenuItem';
import Doc from 'io/doc';
import 'menus/menus.scss';
import 'menus/file-menu.scss';

class FileMenu extends React.Component {
  openFile = e => {
    e = e.nativeEvent || e;

    let files = e.target.files;
    if (files) {
      let reader = new FileReader();
      let fn = files[0].name;

      reader.onload = e => {
        let text = e.target.result;

        let doc = Doc.fromSVG(text, fn.split('.')[0]);

        this.props.openDoc(doc);
      };

      reader.readAsText(files[0]);
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
    let downloadHref;
    let downloadName;

    if (this.props.editor.doc) {
      downloadHref = this.docSVGHref();
      downloadName = this.props.editor.doc.filename('svg');
    }

    return (
      <MenuBody
        absoluteTop={this.props.absoluteTop}
        absoluteLeft={this.props.absoluteLeft}>
        <MenuItem label="New..." hotkey="Ctrl-N" action={this.props.newDoc} />

        <MenuItem className="menu-item--file-input" hotkey="Ctrl-O">
          <input ref="fileInput" type="file" onChange={this.openFile} />
          Open...
        </MenuItem>

        <MenuItem hotkey="Ctrl-S" disabled={!this.props.editor.doc}>
          <a
            className="menu-item__cover"
            ref="downloadAnchor"
            href={downloadHref}
            download={downloadName}
          />
          Save as SVG
        </MenuItem>
      </MenuBody>
    );
  }
}

export default FileMenu;
