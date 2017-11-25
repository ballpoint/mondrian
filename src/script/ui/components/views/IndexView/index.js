import 'views/index.scss';

import Logo from 'ui/components/views/Logo';
import Listing from './Listing';

import backend from 'io/backend/backend';
import LocalBackend from 'io/backend/local';

class IndexView extends React.Component {
  constructor() {
    super();
    this.state = {
      files: [],
      loading: true
    };
  }

  componentDidMount() {
    this.fetchFiles();
  }

  async fetchFiles() {
    let locs = await LocalBackend.list();

    let files = [];

    for (let loc of locs) {
      files.push(loc);
    }

    files = files.sort((a, b) => {
      return b.modified.valueOf() - a.modified.valueOf();
    });

    this.setState({ files, loading: false });
  }

  renderLinks() {
    if (this.state.loading) {
      return null;
    }
    let items = [
      <a href="/files/local/new" className="doc-listing-new">
        New file
      </a>
    ];

    if (this.state.files.length > 0) {
      items = items.concat(
        this.state.files.map(doc => {
          return <Listing doc={doc} />;
        })
      );
    }
    return items;
  }

  render() {
    return (
      <div id="app-index">
        <header>
          <div id="logo-container">
            <Logo />
          </div>
        </header>
        <div id="listings">
          <div className="listings-group">{this.renderLinks()}</div>
        </div>
      </div>
    );
  }
}

export default IndexView;
