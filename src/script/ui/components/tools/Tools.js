import * as tools from 'ui/tools/tools';
import classnames from 'classnames';
import 'tools/tools.scss';
import icons from 'ui/components/icons';
import { renderIcon } from 'ui/components/icons';

const config = [
  {
    label: 'Cursor',
    constructor: tools.Cursor,
    icon: 'cursor'
  },
  {
    label: 'Subcursor',
    constructor: tools.SubCursor,
    icon: 'subcursor'
  },
  {
    label: 'Zoom',
    constructor: tools.Zoom,
    icon: 'zoom'
  },
  {
    label: 'Pen',
    constructor: tools.Pen,
    icon: 'pen'
  },
  {
    label: 'Rect',
    constructor: tools.Rect,
    icon: 'rect'
  },
  {
    label: 'Ellipse',
    constructor: tools.Ellipse,
    icon: 'ellipse'
  },
  {
    label: 'Type',
    constructor: tools.Type,
    icon: 'type'
  },
  {
    label: 'Eyedropper',
    constructor: tools.Eyedropper,
    icon: 'eyedropper'
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
                icon: true,
                selected: isSelected
              })}
              onClick={() => {
                this.props.editor.selectTool(
                  new t.constructor(this.props.editor)
                );
              }}
              title={t.label}>
              {renderIcon(t.icon)}
            </a>
          );
        })}
      </div>
    );
  }
});

export default Tools;
