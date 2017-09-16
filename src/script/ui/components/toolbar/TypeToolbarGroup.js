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

    let selectedFonts = {};
    let selectedSizes = {};
    let selectedSpacings = {};
    for (let item of selectedTextItems) {
      selectedFonts[item.fontFamily()] = true;
      selectedSizes[item.data.size] = true;
      selectedSpacings[item.data.spacing] = true;
    }
    selectedFonts = Object.keys(selectedFonts);
    selectedSizes = Object.keys(selectedSizes).map(s => {
      return parseInt(s, 10);
    });
    selectedSpacings = Object.keys(selectedSpacings).map(s => {
      return parseFloat(s, 10);
    });

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

    console.log(selectedFont, selectedSize, selectedSpacing);

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
            this.props.changeSelectionAttribute(
              Text,
              'fontFamily',
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
            this.props.changeSelectionAttribute(
              Text,
              'size',
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
            this.props.changeSelectionAttribute(
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
            this.props.changeSelectionAttribute(
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
            this.props.changeSelectionAttribute(
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
            this.props.changeSelectionAttribute(
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
            this.props.changeSelectionAttribute(
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
            this.props.changeSelectionAttribute(
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
            this.props.changeSelectionAttribute(
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
