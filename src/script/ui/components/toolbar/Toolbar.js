import bool from 'lib/bool';
import Text from 'geometry/text';
import 'toolbar/toolbar.scss';

import HistoryFrame from 'history/Frame';
import * as actions from 'history/actions/actions';

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
        title={this.props.title}>
        {this.props.children}
      </a>
    );
  }
});

let ToolbarDropdown = React.createClass({
  render() {
    return (
      <div className="toolbar-item" title={this.props.title}>
        {this.props.label}
        <select>
          {this.props.options.map(opt => {
            return (
              <option style={opt.style} value={opt.value}>
                {opt.label}
              </option>
            );
          })}
        </select>
      </div>
    );
  }
});

let ToolbarNumberInput = React.createClass({
  render() {
    return (
      <div className="toolbar-item" title={this.props.title}>
        {this.props.label}
        <input
          type="number"
          onChange={this.props.onChange}
          onBlur={this.props.onBlur}
          style={{ width: this.props.width }}
        />
      </div>
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
          title="Undo">
          UN
        </ToolbarButton>
        <ToolbarButton
          onClick={this.props.editor.redo.bind(this.props.editor)}
          title="Redo">
          RE
        </ToolbarButton>
      </ToolbarGroup>
    );
  },

  changeSelectionAttribute(key, value) {
    let frame = new HistoryFrame([
      actions.SetAttributeAction.forItems(
        this.props.editor.state.selection,
        key,
        value
      )
    ]);

    this.props.editor.stageFrame(frame);
    this.props.editor.commitFrame();
  },

  renderTextGroup() {
    const fonts = [
      'sans-serif',
      'serif',
      'Arial',
      'Times New Roman',
      'Norasi',
      'Ubuntu Mono'
    ];

    return (
      <ToolbarGroup>
        <ToolbarDropdown
          label="Font"
          options={fonts.map(f => {
            return {
              label: f,
              value: f,
              style: { fontFamily: f }
            };
          })}
        />

        <ToolbarNumberInput
          label=""
          width={50}
          onBlur={e => {
            let items = this.props.editor.selectionFlat().filter(item => {
              return item instanceof Text;
            });
            console.log(items);
            let frame = new HistoryFrame([
              actions.SetAttributeAction.forItems(
                items,
                'size',
                parseFloat(e.target.value)
              )
            ]);

            this.props.editor.stageFrame(frame);
            this.props.editor.commitFrame();
          }}
        />

        <ToolbarButton
          title="Align left"
          onClick={() => {
            this.changeSelectionAttribute('align', 'left');
          }}>
          HL
        </ToolbarButton>
        <ToolbarButton
          title="Align center"
          onClick={() => {
            this.changeSelectionAttribute('align', 'center');
          }}>
          HC
        </ToolbarButton>
        <ToolbarButton
          title="Align right"
          onClick={() => {
            this.changeSelectionAttribute('align', 'right');
          }}>
          HR
        </ToolbarButton>

        <ToolbarButton
          title="Vertical align top"
          onClick={() => {
            this.changeSelectionAttribute('valign', 'top');
          }}>
          VT
        </ToolbarButton>
        <ToolbarButton
          title="Vertical align center"
          onClick={() => {
            this.changeSelectionAttribute('valign', 'center');
          }}>
          VC
        </ToolbarButton>
        <ToolbarButton
          title="Vertical align bottom"
          onClick={() => {
            this.changeSelectionAttribute('valign', 'bottom');
          }}>
          VB
        </ToolbarButton>
      </ToolbarGroup>
    );
  },

  renderBooleanGroup() {
    let editor = this.props.editor;

    let boolOp = function(op) {
      return function() {
        let result = bool[op](this.state.selection.slice(0));

        let index = editor.selectedIndexes()[0];

        let frame = new HistoryFrame(
          [
            new actions.DeleteAction({
              items: editor.state.selection.slice(0).map(item => {
                return { item, index: item.index };
              })
            }),
            new actions.InsertAction({
              items: [{ item: result, index }]
            })
          ],
          'Boolean ' + op
        );

        editor.stageFrame(frame);
        editor.commitFrame();
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
          {this.renderTextGroup()}
        </div>
      </div>
    );
  }
});

export default Toolbar;
