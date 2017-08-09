import * as tools from 'ui/tools/tools';
import classnames from 'classnames';
import 'tools/tools.scss';
import CurrentColors from 'ui/components/tools/CurrentColors';

const config = [
  {
    label: 'Cursor',
    constructor: tools.Cursor
  },
  {
    label: 'Subcursor',
    constructor: tools.SubCursor
  },
  {
    label: 'Zoom',
    constructor: tools.Zoom
  },
  {
    label: 'Pen',
    constructor: tools.Pen
  },
  {
    label: 'Rect',
    constructor: tools.Rect
  }
];

let Tools = React.createClass({
  getInitialState() {
    return {
      selected: this.props.editor.state.tool
    };
  },

  componentDidMount() {
    this.props.editor.on('change:tool', () => {
      if (
        !this.state.selected ||
        this.props.editor.state.tool.id !== this.state.selected.id
      ) {
        this.setState({
          selected: this.props.editor.state.tool
        });
      }
    });
  },

  render() {
    return (
      <div>
        {config.map(t => {
          let isSelected =
            this.state.selected &&
            this.props.editor.state.tool.constructor === t.constructor;
          return (
            <div
              className={classnames({
                'app-tool': true,
                selected: isSelected
              })}
              onClick={() => {
                this.props.editor.selectTool(
                  new t.constructor(this.props.editor)
                );
              }}
            >
              {t.label}
            </div>
          );
        })}

        {<CurrentColors editor={this.props.editor} />}
      </div>
    );
  }
});

export default Tools;
