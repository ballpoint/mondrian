import "menus.scss";

const menus = [
  {
    name: 'File',
    body: 'FileMenu',
  }
]

let Menus = React.createClass({

  render() {
    return (
      <div className="app-menus-row">
        <div className="app-menu-button">
          File
        </div>
        <div className="app-menu-button">
          Edit
        </div>
      </div>
    );
  }

});

export default Menus;
