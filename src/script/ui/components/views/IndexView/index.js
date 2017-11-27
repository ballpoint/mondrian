import 'views/index.scss';

import io from 'io/io';

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

    //this.refs.root.addEventListener('drop', this.drop.bind(this));
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
      <a key="newFile" href="/files/local/new" className="doc-listing-new">
        New file
      </a>
    ];

    if (this.state.files.length > 0) {
      items = items.concat(
        this.state.files.map(doc => {
          return (
            <Listing
              key={doc.path}
              doc={doc}
              remove={e => {
                e.preventDefault();
                e.stopPropagation();

                if (
                  !confirm('Are you sure you want to delete ' + doc.name + '?')
                ) {
                  return;
                }

                doc.backend.destroy(doc.path);

                this.setState({
                  files: this.state.files.filter(f => {
                    return f.path !== doc.path;
                  })
                });
              }}
            />
          );
        })
      );
    }
    return items;
  }

  async drop(e) {
    e = e.nativeEvent || e;
    let items = e.dataTransfer.items;

    let files = [];

    for (let item of items) {
      files.push(item.getAsFile());
    }

    let readNext = async () => {
      let file = files[0];
      files = files.slice(1);

      try {
        let doc = await io.parseNativeFile(file);
        doc.metadata = LocalBackend.assign(doc);

        await doc.save();
      } catch (e) {
        console.error('Error parsing', file, e);
      }

      if (files.length === 0) {
        this.fetchFiles();
      } else {
        setTimeout(readNext(), 10);
      }
    };

    readNext();
  }

  render() {
    return (
      <div
        id="app-index"
        onDrop={e => {
          e.preventDefault();
          this.drop(e);
        }}
        onDragOver={e => {
          e.preventDefault();
        }}>
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
