import * as tools from 'ui/tools/tools';
import classnames from 'classnames';
import 'tools/tools.scss';
import CurrentColors from 'ui/components/tools/CurrentColors';
import icons from 'ui/components/icons';

const config = [
  {
    label: 'Cursor',
    constructor: tools.Cursor,
    icon: icons.cursor
  },
  {
    label: 'Subcursor',
    constructor: tools.SubCursor,
    icon: icons.cursor
  },
  {
    label: 'Zoom',
    constructor: tools.Zoom,
    icon: icons.zoom
  },
  {
    label: 'Pen',
    constructor: tools.Pen,
    icon: icons.pen
  },
  {
    label: 'Rect',
    constructor: tools.Rect,
    icon: icons.rect
  },
  {
    label: 'Ellipse',
    constructor: tools.Ellipse,
    icon: icons.ellipse
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
            <a
              className={classnames({
                'app-tool': true,
                selected: isSelected
              })}
              onClick={() => {
                this.props.editor.selectTool(
                  new t.constructor(this.props.editor)
                );
              }}
              dangerouslySetInnerHTML={{ __html: t.icon || icons.todo }}
              title={t.label}
            />
          );
        })}

        {<CurrentColors editor={this.props.editor} />}
      </div>
    );
  }
});

export default Tools;
