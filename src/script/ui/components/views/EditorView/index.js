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
import NewsletterForm from './NewsletterForm';

import io from 'io/io';

import backend from 'io/backend/backend';
import LocalBackend from 'io/backend/local';

import initEditorHotkeys from 'ui/components/views/EditorView/hotkeys';

import NewDocumentDialog from 'ui/components/views/EditorView/dialogs/NewDocument';

// Main view
class EditorView extends React.Component {
  constructor(props) {
    super(props);

    let editor = new Editor();

    this.state = {
      editor
    };

    let saveDebounced = _.debounce(() => {
      editor.doc.save();
    }, 500);

    initEditorHotkeys.call(this, editor);

    editor.on('history:step', () => {
      try {
        saveDebounced();
      } catch (e) {
        console.error('Error saving document', e);
      }
    });
  }

  componentDidMount() {
    let render = this.refs.render;
    this.state.editor.mount(render);

    this.parseURL();
  }

  async parseURL() {
    let fileParams = backend.parseParamsFromURL();
    let doc;

    console.info(fileParams);

    if (fileParams.backend && fileParams.path) {
      if (fileParams.path === 'new') {
        this.openNewDocDialog();
      } else {
        doc = await backend.loadFromParams(fileParams.backend, fileParams.path);
      }
    } else {
      doc = await backend.loadLastModifiedDoc();
    }

    if (doc) {
      try {
        this.openDoc(doc);
      } catch (e) {
        console.error('Error opening doc', doc, e);
      }
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

  async importNativeFile(file) {
    let doc = await io.parseNativeFile(file);
    // If we have a fresh, empty doc open currently, we overwrite it
    let currentDoc = this.state.editor.doc;
    if (currentDoc && currentDoc.history.frames.length === 1) {
      doc.metadata = currentDoc.metadata;
    } else {
      doc.metadata = LocalBackend.assign(doc);
    }

    doc.save();

    if (doc) {
      this.openDoc(doc);
    }
  }

  drop(e) {
    e = e.nativeEvent || e;
    e.preventDefault();
    let file = e.dataTransfer.items[0].getAsFile();
    this.importNativeFile(file);
  }

  openNewDocDialog() {
    this.setState({ dialog: 'newDoc' });
  }

  async newDoc(params) {
    let doc = await backend.newDoc(params);
    this.openDoc(doc);
  }

  closeDialog() {
    this.setState({ dialog: null });
  }

  renderDialog() {
    let dialog;
    let dialogTitle;

    switch (this.state.dialog) {
      case 'newDoc':
        dialogTitle = 'New Document';
        dialog = (
          <NewDocumentDialog
            close={this.closeDialog.bind(this)}
            create={this.newDoc.bind(this)}
          />
        );
    }

    if (!dialog || !dialogTitle) {
      return null;
    }

    return (
      <div id="app-dialog" onClick={this.closeDialog.bind(this)}>
        <div
          id="app-dialog-window"
          onClick={e => {
            e.stopPropagation();
          }}>
          <div id="app-dialog-header">{dialogTitle}</div>

          <div id="app-dialog-body">{dialog}</div>
        </div>
      </div>
    );
  }

  render() {
    let showEditor = !this.state.indexView;

    return (
      <div
        id="app-editor"
        onDrop={this.drop.bind(this)}
        onDragOver={e => {
          e.preventDefault();
        }}>
        <header>
          <a id="logo-container" href="/files">
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
                newDoc={this.openNewDocDialog.bind(this)}
                importNativeFile={this.importNativeFile.bind(this)}
              />
            </div>
            <div id="app-toolbar">
              <Toolbar editor={this.state.editor} doc={this.state.activeDoc} />
            </div>
          </div>

          <NewsletterForm />
        </header>

        <div id="app-view">
          <div id="app-tools">
            <Tools editor={this.state.editor} />
          </div>

          <div id="app-render" ref="render" />

          <div id="app-windows">
            <Utils editor={this.state.editor} />
          </div>

          {this.renderDialog()}
        </div>
      </div>
    );
  }
}

export default EditorView;
