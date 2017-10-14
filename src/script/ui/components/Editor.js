import Editor from 'ui/editor';
import Utils from 'ui/components/utils/Utils';
import Tools from 'ui/components/tools/Tools';
import Toolbar from 'ui/components/toolbar/Toolbar';
import Title from 'ui/components/title/Title';
import Menus from 'ui/components/menus/Menus';

// Main view
let EditorView = React.createClass({
  componentDidMount() {},

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
            <div id="app-title" />
            <div id="app-menus" />
            <div id="app-toolbar" />
          </div>
        </header>

        <div id="app-view">
          <div id="app-tools" />

          <div id="app-render" />

          <div id="app-windows" />
        </div>
      </div>
    );
  }
});
