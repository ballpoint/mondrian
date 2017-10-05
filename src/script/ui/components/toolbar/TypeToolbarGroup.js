import Item from 'geometry/item';
import Text from 'geometry/text';
import { renderIcon } from 'ui/components/icons';

import ToolbarGroup from 'ui/components/toolbar/ToolbarGroup';
import ToolbarButton from 'ui/components/toolbar/ToolbarButton';
import ToolbarDropdown from 'ui/components/toolbar/ToolbarDropdown';
import ToolbarNumberInput from 'ui/components/toolbar/ToolbarNumberInput';

let TypeToolbarGroup = React.createClass({
  render() {
    let selectedTextItems = this.props.editor.state.selection.ofType(Text);
    let selectedTool = this.props.editor.state.tool;

    if (selectedTextItems.length === 0 && selectedTool.id !== 'type') {
      return null;
    }

    const fonts = [
      'sans-serif', // system default
      'serif', // system default
      'Arial',
      'Courier',
      'Ubuntu Mono'
    ];

    let selectedFont = this.props.editor.getAttribute(Item, 'font-family');
    let selectedSize = this.props.editor.getAttribute(Item, 'font-size');
    let selectedSpacing = this.props.editor.getAttribute(Item, 'line-height');

    return (
      <ToolbarGroup>
        <ToolbarDropdown
          selected={selectedFont}
          options={fonts.map(f => {
            return {
              label: f,
              value: f,
              style: { fontFamily: f }
            };
          })}
          onChange={value => {
            this.props.editor.changeAttribute(
              Text,
              'font-family',
              value,
              'Change font'
            );
          }}
        />

        <ToolbarNumberInput
          label=""
          value={selectedSize}
          width={40}
          onSubmit={val => {
            this.props.editor.changeAttribute(
              Text,
              'font-size',
              parseInt(val, 10),
              'Change font size'
            );
          }}
        />

        <ToolbarNumberInput
          label=""
          value={selectedSpacing}
          width={40}
          onSubmit={val => {
            this.props.editor.changeAttribute(
              Text,
              'line-height',
              parseFloat(val),
              'Change font spacing'
            );
          }}
        />

        <ToolbarButton
          title="Align left"
          onClick={() => {
            this.props.editor.changeAttribute(
              Text,
              'align',
              'left',
              'Align left'
            );
          }}>
          {renderIcon('alignLeft')}
        </ToolbarButton>
        <ToolbarButton
          title="Align center"
          onClick={() => {
            this.props.editor.changeAttribute(
              Text,
              'align',
              'center',
              'Align center'
            );
          }}>
          {renderIcon('alignCenter')}
        </ToolbarButton>
        <ToolbarButton
          title="Align right"
          onClick={() => {
            this.props.editor.changeAttribute(
              Text,
              'align',
              'right',
              'Align right'
            );
          }}>
          {renderIcon('alignRight')}
        </ToolbarButton>

        <ToolbarButton
          title="Vertical align top"
          onClick={() => {
            this.props.editor.changeAttribute(
              Text,
              'valign',
              'top',
              'Vertical align top'
            );
          }}>
          {renderIcon('valignTop')}
        </ToolbarButton>
        <ToolbarButton
          title="Vertical align center"
          onClick={() => {
            this.props.editor.changeAttribute(
              Text,
              'valign',
              'center',
              'Vertical align center'
            );
          }}>
          {renderIcon('valignCenter')}
        </ToolbarButton>
        <ToolbarButton
          title="Vertical align bottom"
          onClick={() => {
            this.props.editor.changeAttribute(
              Text,
              'valign',
              'bottom',
              'Vertical align bottom'
            );
          }}>
          {renderIcon('valignBottom')}
        </ToolbarButton>
      </ToolbarGroup>
    );
  }
});

export default TypeToolbarGroup;
