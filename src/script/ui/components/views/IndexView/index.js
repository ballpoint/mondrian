import 'views/index.scss';

import Logo from 'ui/components/views/Logo';
import Listing from './Listing';

import backend from 'io/backend/backend';
import LocalBackend from 'io/backend/local';

class IndexView extends React.Component {
  constructor() {
    super();
    this.state = {
      files: []
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

    this.setState({ files });
  }

  renderLinks() {
    return this.state.files.map(doc => {
      return <Listing doc={doc} />;
    });
  }

  render() {
    return (
      <div id="app-main">
        <header id="app-header">
          <Logo />
        </header>
        <div id="listings">
          <div className="listings-group">{this.renderLinks()}</div>
        </div>
      </div>
    );
  }
}

export default IndexView;
