import { insideOf } from 'lib/dom';
import MenuButton from 'ui/components/menus/MenuButton';
import FileMenu from 'ui/components/menus/FileMenu';
import EditMenu from 'ui/components/menus/EditMenu';
import ViewMenu from 'ui/components/menus/ViewMenu';
import GeometryMenu from 'ui/components/menus/GeometryMenu';
import 'menus/menus.scss';

const menus = [
  {
    name: 'File',
    render: FileMenu
  },
  {
    name: 'Edit',
    render: EditMenu
  },
  {
    name: 'View',
    render: ViewMenu
  },
  {
    name: 'Geometry',
    render: GeometryMenu
  }
];

const fileMenu = menus[0];
const editMenu = menus[1];
const viewMenu = menus[2];

class Menus extends React.Component {
  state = {
    active: null
  };

  componentDidMount() {
    document.addEventListener('mousedown', e => {
      let root = ReactDOM.findDOMNode(this);
      if (!this.state.active) return;
      let inside = insideOf(e.target, root);
      if (!inside) {
        this.closeActive();
      }
    });

    this.props.editor.on('change', () => {
      this.forceUpdate();
    });

    this.props.editor.on('hotkey:open', e => {
      this.activateMenu(fileMenu);
      setTimeout(() => {
        let inputNode = ReactDOM.findDOMNode(
          this.refs.activeMenu.refs.fileInput
        );
        if (inputNode) {
          inputNode.click();
        }
      }, 100);
    });

    this.props.editor.on('hotkey:save', e => {
      this.activateMenu(fileMenu);
      setTimeout(() => {
        let anchorNode = ReactDOM.findDOMNode(
          this.refs.activeMenu.refs.downloadAnchor
        );
        if (anchorNode) {
          anchorNode.click();
        }
      }, 100);
    });
  }

  closeActive = () => {
    this.setState({
      active: null,
      activeButton: null
    });
  };

  renderActiveMenu = () => {
    let a = this.state.active;
    if (a) {
      let button = this.state.activeButton; //ReactDOM.findDOMNode(this.refs['button'+a.name]);
      let box = button.getBoundingClientRect();
      return (
        <this.state.active.render
          ref="activeMenu"
          absoluteTop={box.bottom}
          absoluteLeft={box.left}
          {...this.props}
        />
      );
    }
  };

  activateMenu = m => {
    let button = ReactDOM.findDOMNode(this.refs['button' + m.name]);

    this.setState({
      active: m,
      activeButton: button
    });
  };

  render() {
    return (
      <div className="app-menus-row">
        {menus.map(m => {
          return (
            <MenuButton
              key={m.name}
              name={m.name}
              ref={'button' + m.name}
              active={this.state.active === m}
              onClick={e => {
                if (this.state.active === m) {
                  this.closeActive();
                } else {
                  this.activateMenu(m);
                }
              }}
              onMouseEnter={e => {
                if (this.state.active) {
                  // Steal focus
                  this.activateMenu(m);
                }
              }}
            />
          );
        })}

        {this.renderActiveMenu()}
      </div>
    );
  }
}

export default Menus;
