import 'views/editor.scss';

import Editor from 'ui/editor';
import Doc from 'io/doc';
import DocMetadata from 'io/backend/metadata';

import Logo from 'ui/components/views/Logo';

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
      // For file index view:
      //indexView: true,
      indexBackend: null,

      // For file edit view:
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
    let showEditor = !this.state.indexView;

    return (
      <div id="app-main">
        <header id="editor-header">
          <a id="logo">
            <Logo />
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
