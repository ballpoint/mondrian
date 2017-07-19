import { insideOf } from 'lib/dom';
import MenuButton from 'ui/components/menus/MenuButton';
import FileMenu from 'ui/components/menus/FileMenu';
import EditMenu from 'ui/components/menus/EditMenu';
import HistoryMenu from 'ui/components/menus/HistoryMenu';
import "menus.scss";

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
    render: FileMenu
  },
  {
    name: 'Help',
    render: FileMenu
  }
]

let Menus = React.createClass({

  getInitialState() {
    return {
      active: null
    }
  },

  componentDidMount() {
    document.addEventListener('mousedown', (e) => {
      let root = ReactDOM.findDOMNode(this);
      if (!this.state.active) return;
      let inside = insideOf(e.target, root);
      if (!inside) {
        this.closeActive();
      }
    });
  },

  closeActive() {
    this.setState({
      active: null,
      activeButton: null
    });
  },

  renderActiveMenu() {
    let a = this.state.active;
    if (a) {
      let button = this.state.activeButton;//ReactDOM.findDOMNode(this.refs['button'+a.name]);
      let box = button.getBoundingClientRect();
      return (
        <this.state.active.render
          editor={this.props.editor}
          absoluteTop={box.bottom}
          absoluteLeft={box.left}
        />
      );
    }
  },

  render() {
    return (
      <div className="app-menus-row">
        {
          menus.map((m) => {
            return <MenuButton
              key={m.name}
              name={m.name}
              ref={'button'+m.name}
              active={this.state.active === m}
              onClick={(e) => {
                if (this.state.active === m) {
                  this.closeActive();
                } else {
                  this.setState({
                    active: m,
                    activeButton: e.target,
                  });
                }
              }}
              onMouseEnter={(e) => {
                if (this.state.active) {
                  // Steal focus
                  this.setState({
                    active: m,
                    activeButton: e.target,
                  });
                }
              }}
            />
          })
        }

        {
          this.renderActiveMenu()
        }
      </div>
    );
  }

});

export default Menus;
