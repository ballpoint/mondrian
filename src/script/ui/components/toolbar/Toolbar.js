import bool from 'lib/bool';
import 'toolbar/toolbar.scss';

let ToolbarGroup = React.createClass({
  render() {
    return (
      <div className="toolbar-group">
        {this.props.children}
      </div>
    );
  }
});

let ToolbarButton = React.createClass({
  render() {
    return (
      <a
        className="toolbar-button"
        onClick={this.props.onClick}
        title={this.props.title}
      >
        {this.props.children}
      </a>
    );
  }
});

let Toolbar = React.createClass({
  getInitialState() {
    return {
      selection: null
    };
  },

  componentDidMount() {
    this.props.editor.on('change:selection', () => {
      this.setState({
        selection: this.props.editor.state.selection,
        selectionType: this.props.editor.state.selectionType
      });
    });
  },

  renderHistoryGroup() {
    return (
      <ToolbarGroup>
        <ToolbarButton
          onClick={this.props.editor.undo.bind(this.props.editor)}
          title="Undo"
        >
          UN
        </ToolbarButton>
        <ToolbarButton
          onClick={this.props.editor.redo.bind(this.props.editor)}
          title="Redo"
        >
          RE
        </ToolbarButton>
      </ToolbarGroup>
    );
  },

  renderBooleanGroup() {
    let editor = this.props.editor;

    let boolOp = function(op) {
      return function() {
        let result = bool[op](this.state.selection.slice(0));
        editor.deleteSelection();
        editor.insertElements([result]);
      }.bind(this);
    }.bind(this);

    if (this.state.selection && this.state.selection.length > 1) {
      return (
        <ToolbarGroup>
          <ToolbarButton onClick={boolOp('unite')} title="Unite">
            U
          </ToolbarButton>
          <ToolbarButton onClick={boolOp('subtract')} title="Subtract">
            S
          </ToolbarButton>
          <ToolbarButton onClick={boolOp('intersect')} title="Intersect">
            X
          </ToolbarButton>
        </ToolbarGroup>
      );
    }
  },

  render() {
    return (
      <div>
        <div className="toolbar-group">
          {this.renderHistoryGroup()}
          {this.renderBooleanGroup()}
        </div>
      </div>
    );
  }
});

export default Toolbar;
