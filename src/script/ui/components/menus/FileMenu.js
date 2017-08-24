import MenuBody from 'ui/components/menus/MenuBody';
import MenuItem from 'ui/components/menus/MenuItem';
import Doc from 'io/doc';
import 'menus/menus.scss';
import 'menus/file-menu.scss';

let FileMenu = React.createClass({
  openFile(e) {
    e = e.nativeEvent || e;

    let files = e.target.files;
    if (files) {
      let reader = new FileReader();
      let fn = files[0].name;

      reader.onload = e => {
        let text = e.target.result;

        let doc = Doc.fromSVG(text, fn);

        this.props.editor.load(doc);
      };

      reader.readAsText(files[0]);
    } else {
      console.warn('Failed to read files');
    }
  },

  docSVGHref() {
    return (
      'data:image/svg+xml;charset=utf-8;base64,' +
      btoa(this.props.editor.doc.toSVG())
    );
  },

  render() {
    return (
      <MenuBody
        absoluteTop={this.props.absoluteTop}
        absoluteLeft={this.props.absoluteLeft}>
        <MenuItem label="New" />
        <MenuItem>
          <a
            className="menu-item__cover"
            href={this.docSVGHref()}
            download={this.props.editor.doc.name}
          />
          Save
        </MenuItem>
        <MenuItem className="menu-item--file-input" hotkey="Ctrl-O">
          <input ref="fileInput" type="file" onChange={this.openFile} />
          Open
        </MenuItem>
      </MenuBody>
    );
  }
});

export default FileMenu;
