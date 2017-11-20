import Editor from 'ui/editor';
import Doc from 'io/doc';
import { DocLocation } from 'io/backend/backend';

import Utils from 'ui/components/utils/Utils';
import Tools from 'ui/components/tools/Tools';
import Toolbar from 'ui/components/toolbar/Toolbar';
import Title from 'ui/components/title/Title';
import Menus from 'ui/components/menus/Menus';
import Filetabs from 'ui/components/filetabs/Filetabs';

import google from 'google.svg';

import backend from 'io/backend/backend';

// Main view
class EditorView extends React.Component {
  constructor(props) {
    super(props);

    let editor = new Editor();

    this.state = {
      editor
    };

    editor.on('history:step', () => {
      try {
        editor.doc.location.save(editor.doc);
      } catch (e) {
        console.error('Error saving document', e);
      }
    });
  }

  componentDidMount() {
    let render = this.refs.render;
    this.state.editor.mount(render);

    this.loadFromURL();
  }

  async loadFromURL() {
    try {
      let doc = await backend.parseDocFromURL();
      this.openDoc(doc);
    } catch (e) {
      console.error('Error opening file', e);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.activeDoc !== prevState.activeDoc) {
      this.state.editor.open(this.state.activeDoc);
    }
  }

  viewDoc(doc) {
    this.setState({
      activeDoc: doc
    });
  }

  openDoc(doc) {
    this.setState({
      activeDoc: doc
    });

    if (!doc.location) {
      doc.location = DocLocation.defaultLocal(doc);
    }

    doc.location.save(doc);

    backend.replaceLocation(doc);
  }

  newDoc() {
    let width = 1000;
    let height = 600;

    if (this.state.activeDoc) {
      width = this.state.activeDoc.width;
      height = this.state.activeDoc.height;
    }
    let doc = Doc.empty(width, height, 'untitled');
    this.openDoc(doc);
  }

  render() {
    return (
      <div id="app-main">
        <header id="app-header">
          <a id="logo">
            <svg width="40" height="40">
              <rect x="0" y="0" width="40" height="40" className="logo-bg" />
              <rect x="6" y="8" width="6" height="22" className="logo-fg" />
              <rect x="17" y="8" width="6" height="10" className="logo-fg" />
              <rect x="28" y="8" width="6" height="22" className="logo-fg" />
            </svg>
          </a>
          <div id="app-controls">
            <div id="app-title">
              <Title
                value={this.state.activeDoc ? this.state.activeDoc.name : ''}
                rename={name => {
                  this.state.editor.setDocName(name);
                }}
              />
            </div>
            <div id="app-menus">
              <Menus
                editor={this.state.editor}
                doc={this.state.activeDoc}
                openDoc={this.openDoc.bind(this)}
                newDoc={this.newDoc.bind(this)}
              />
            </div>
            <div id="app-toolbar">
              <Toolbar editor={this.state.editor} doc={this.state.activeDoc} />
            </div>
          </div>
        </header>

        <div id="app-view">
          <div id="app-tools">
            <Tools editor={this.state.editor} />
          </div>

          <div id="app-render" ref="render" />

          <div id="app-windows">
            <Utils editor={this.state.editor} />
          </div>
        </div>
      </div>
    );
  }
}

export default EditorView;
