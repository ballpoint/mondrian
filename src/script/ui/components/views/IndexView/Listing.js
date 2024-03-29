import 'listings.scss';
import { renderIcon } from 'ui/components/icons';

class Listing extends React.Component {
  render() {
    let doc = this.props.doc;
    let thumbHeight = 140;
    let style = {};
    let thumb;

    if (doc.width !== undefined && doc.height !== undefined) {
      let ratio = doc.width / doc.height;
      let basis;
      if (!isNaN(ratio)) {
        basis = Math.max(100, Math.min(400, thumbHeight * ratio));

        style.flexBasis = basis + 'px';
        style.maxWidth = basis * 1.2 + 'px';
      }

      if (doc.thumb) {
        thumb = (
          <img
            src={doc.thumb}
            style={{
              maxWidth: basis,
              maxHeight: 140
            }}
          />
        );
      }
    }

    return (
      <a
        className="doc-listing"
        key={doc.path}
        style={style}
        href={`/files/${doc.backend.id}/${doc.path}`}>
        <div className="doc-listing__header">
          <div className="doc-listing__name">{doc.name}</div>

          <div className="doc-listing__remove" onClick={this.props.remove}>
            {renderIcon('del', { width: 18, height: 18, padding: 5 })}
          </div>
        </div>
        <div className="doc-listing__thumb">{thumb}</div>
      </a>
    );
  }
}

export default Listing;
