import Text from 'geometry/text';
import { renderIcon } from 'ui/components/icons';

import ToolbarGroup from 'ui/components/toolbar/ToolbarGroup';
import ToolbarButton from 'ui/components/toolbar/ToolbarButton';
import ToolbarDropdown from 'ui/components/toolbar/ToolbarDropdown';
import ToolbarNumberInput from 'ui/components/toolbar/ToolbarNumberInput';

let TypeToolbarGroup = React.createClass({
  render() {
    let selectedTextItems = this.props.editor.selectedOfType(Text);
    if (selectedTextItems.length === 0) return null;

    const fonts = [
      'sans-serif',
      'serif',
      'Arial',
      'Times New Roman',
      'Norasi',
      'Ubuntu Mono'
    ];

    let selectedFonts = this.props.editor.selectedAttributeValues(
      'font-family'
    );
    let selectedSizes = this.props.editor.selectedAttributeValues('font-size');
    let selectedSpacings = this.props.editor.selectedAttributeValues('spacing');

    let selectedFont = null;
    let selectedSize = null;
    let selectedSpacing = null;

    if (selectedFonts.length === 1) {
      selectedFont = selectedFonts[0];
    }
    if (selectedSizes.length === 1) {
      selectedSize = selectedSizes[0];
    }
    if (selectedSpacings.length === 1) {
      selectedSpacing = selectedSpacings[0];
    }

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
            this.props.editor.changeSelectionAttribute(
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
            this.props.editor.changeSelectionAttribute(
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
            this.props.editor.changeSelectionAttribute(
              Text,
              'spacing',
              parseInt(val, 10),
              'Change font spacing'
            );
          }}
        />

        <ToolbarButton
          title="Align left"
          onClick={() => {
            this.props.editor.changeSelectionAttribute(
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
            this.props.editor.changeSelectionAttribute(
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
            this.props.editor.changeSelectionAttribute(
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
            this.props.editor.changeSelectionAttribute(
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
            this.props.editor.changeSelectionAttribute(
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
            this.props.editor.changeSelectionAttribute(
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
