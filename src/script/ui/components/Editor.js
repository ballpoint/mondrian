import Editor from 'ui/editor';
import Doc from 'io/doc';

import Utils from 'ui/components/utils/Utils';
import Tools from 'ui/components/tools/Tools';
import Toolbar from 'ui/components/toolbar/Toolbar';
import Title from 'ui/components/title/Title';
import Menus from 'ui/components/menus/Menus';

// Main view
class EditorView extends React.Component {
  constructor(props) {
    super(props);

    let editor = new Editor();

    this.state = {
      editor
    };

    if (this.props.doc) {
      let doc;
      if (false && window.__RENDERER__) {
        doc = new Doc({
          layers: [],
          name: this.props.doc.name
        });
      } else {
        doc = Doc.fromSVG(this.props.doc.svg, this.props.doc.name);
      }
      this.state.editor.load(doc);
    }
  }

  componentDidMount() {
    let render = this.refs.render;

    this.state.editor.mount(render);
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
              <Title value={this.state.editor.doc.name} />
            </div>
            <div id="app-menus">
              <Menus editor={this.state.editor} />
            </div>
            <div id="app-toolbar">
              <Toolbar editor={this.state.editor} />
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
