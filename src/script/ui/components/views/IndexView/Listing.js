import 'listings.scss';

class Listing extends React.Component {
  render() {
    let doc = this.props.doc;
    let thumbHeight = 140;
    let style = {};

    console.log(doc);

    if (doc.width !== undefined && doc.height !== undefined) {
      let ratio = doc.width / doc.height;
      let basis;
      if (!isNaN(ratio)) {
        basis = Math.max(100, Math.min(400, thumbHeight * ratio));

        style.flexBasis = basis + 'px';
        style.maxWidth = basis * 1.2 + 'px';
      }
    }

    return (
      <a
        className="doc-listing"
        key={doc.path}
        target="_blank"
        style={style}
        href={`/files/${doc.backend.id}/${doc.path}`}>
        <div className="doc-listing__thumb" />
        <div className="doc-listing__name">{doc.name}</div>
      </a>
    );
  }
}

export default Listing;
