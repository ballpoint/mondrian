import 'listings.scss';

class Listing extends React.Component {
  render() {
    return (
      <a
        className="loc-listing"
        key={this.props.loc.path}
        target="_blank"
        href={`/files/${this.props.loc.backend.id}/${this.props.loc.path}`}>
        <div className="loc-listing__thumb" />
        <div className="loc-listing__name">{this.props.loc.name}</div>
      </a>
    );
  }
}

export default Listing;
