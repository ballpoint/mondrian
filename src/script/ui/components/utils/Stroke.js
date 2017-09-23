import Item from 'geometry/item';
import Util from 'ui/components/utils/Util';
import TextInput from 'ui/components/utils/TextInput';
import { renderIcon } from 'ui/components/icons';
import 'utils/stroke.scss';
import classnames from 'classnames';

let StrokeUtil = React.createClass({
  renderAttrButton(attr, val, icon) {
    let selectedLineCap = this.props.editor.selectedAttributeValue(Item, attr);

    return (
      <div
        className={classnames({
          'stroke-util__button': true
        })}
        onClick={e => {
          this.props.editor.changeSelectionAttribute(
            Item,
            attr,
            val,
            'Change stroke linecap'
          );
        }}>
        {renderIcon(icon, {
          selected: val === selectedLineCap
        })}
      </div>
    );
  },

  render() {
    let selectedWidth = this.props.editor.selectedAttributeValue(
      Item,
      'stroke-width'
    );

    let selectedLineJoin = this.props.editor.selectedAttributeValue(
      Item,
      'stroke-linejoin'
    );

    return (
      <Util title="Stroke" id="stroke">
        <div className="stroke-util">
          <div className="stroke-util__row">
            <div className="stroke-util__row__label">Width</div>
            <div className="stroke-util__row__control">
              <TextInput
                id="stroke-util-width"
                width="50"
                value={selectedWidth}
                onSubmit={v => {
                  this.props.editor.changeSelectionAttribute(
                    Item,
                    'stroke-width',
                    v,
                    'Change stroke width'
                  );
                }}
              />
            </div>
          </div>

          <div className="stroke-util__row">
            <div className="stroke-util__row__label">Line cap</div>
            <div className="stroke-util__row__control">
              <div className="stroke-util__button-group">
                {this.renderAttrButton('stroke-linecap', 'butt', 'linecapButt')}
                {this.renderAttrButton(
                  'stroke-linecap',
                  'square',
                  'linecapSquare'
                )}
                {this.renderAttrButton(
                  'stroke-linecap',
                  'round',
                  'linecapRound'
                )}
              </div>
            </div>
          </div>

          <div className="stroke-util__row">
            <div className="stroke-util__row__label">Line join</div>
            <div className="stroke-util__row__control">
              <div className="stroke-util__button-group">
                {this.renderAttrButton(
                  'stroke-linejoin',
                  'miter',
                  'linejoinMiter'
                )}
                {this.renderAttrButton(
                  'stroke-linejoin',
                  'bevel',
                  'linejoinBevel'
                )}
                {this.renderAttrButton(
                  'stroke-linejoin',
                  'round',
                  'linejoinRound'
                )}
              </div>
            </div>
          </div>
        </div>
      </Util>
    );
  }
});

export default StrokeUtil;
