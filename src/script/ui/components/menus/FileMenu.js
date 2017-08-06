import MenuBody from 'ui/components/menus/MenuBody';
import MenuItem from 'ui/components/menus/MenuItem';
import Doc from 'io/doc';
import "menus.scss";
import "menus/file-menu.scss";

let FileMenu = React.createClass({

  openFile(e) {
    e = e.nativeEvent || e;

    let files = e.target.files;
    if (files) {
      let reader = new FileReader();
      let fn = files[0].name;
      console.log(files);

      reader.onload = (e) => {
        let text = e.target.result;

        let doc = Doc.fromSVG(text, fn);

        this.props.editor.load(doc);
      }

      reader.readAsText(files[0]);
    } else {
      console.warn('Failed to read files');
    }
  },

  render() {
    return (
      <MenuBody absoluteTop={this.props.absoluteTop} absoluteLeft={this.props.absoluteLeft}>
        <MenuItem label="New" />
        <MenuItem label="Save" />
        <MenuItem className="menu-item--file-input">
          <input ref="fileInput" type="file" onChange={this.openFile} />
          Open
        </MenuItem>
      </MenuBody>
    );
  }
});

export default FileMenu;

