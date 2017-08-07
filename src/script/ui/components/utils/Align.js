import classnames from 'classnames';
import Util from 'ui/components/utils/Util';
import 'utils/align.scss';

let AlignUtilButton = React.createClass({
  render() {
    return (
      <div className={classnames({
        "align-util-button": true,
        ["align-util-button--"+this.props.which]: true,
      })}>
        <div className="align-util-button__item" />
        <div className="align-util-button__item" />
      </div>
    );
  }
});

let AlignUtil = React.createClass({
  render() {
    return (
      <Util title="Align">
        <div id="align-util__main">
          <div id="align-util__2d-box">
            <svg className="align-util__guides">
              <line x1="20%" y1="50%" x2="80%" y2="50%" />
              <line y1="20%" x1="50%" y2="80%" x2="50%" />
              <line x1="20%" y1="20%" x2="80%" y2="80%" />
              <line x1="80%" y1="20%" x2="20%" y2="80%" />
            </svg>

            <AlignUtilButton which="tl" />
            <AlignUtilButton which="tc" />
            <AlignUtilButton which="tr" />
            <AlignUtilButton which="cl" />
            <AlignUtilButton which="c" />
            <AlignUtilButton which="cr" />
            <AlignUtilButton which="bl" />
            <AlignUtilButton which="bc" />
            <AlignUtilButton which="br" />
          </div>
          <div id="align-util__1d-v">
            <AlignUtilButton which="vt" />
            <AlignUtilButton which="vc" />
            <AlignUtilButton which="vb" />
          </div>
          <div id="align-util__1d-h">
            <AlignUtilButton which="hl" />
            <AlignUtilButton which="hc" />
            <AlignUtilButton which="hr" />
          </div>
          <div id="align-util__scope-menu">
            <AlignUtilButton />
          </div>
        </div>
      </Util>
    );
  }
});

export default AlignUtil;
