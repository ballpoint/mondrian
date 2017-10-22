import classnames from 'classnames';
import 'filetabs/filetabs.scss';
import { renderIcon } from 'ui/components/icons';

class Filetabs extends React.Component {
  render() {
    let tabs = [];
    let i = 0;
    for (let doc of this.props.files) {
      tabs.push(
        <div
          className={classnames({
            filetab: true,
            active: doc === this.props.active
          })}
          key={i}
          onClick={() => {
            this.props.viewDoc(doc);
          }}>
          {doc.name}

          {renderIcon('del')}
        </div>
      );
      i++;
    }

    return <div className="filetabs">{tabs}</div>;
  }
}

export default Filetabs;
