import classnames from 'classnames';
import Util from 'ui/components/utils/Util';
import 'utils/align.scss';

import HistoryFrame from 'history/Frame';
import * as actions from 'history/actions/actions';

let AlignUtilButton = React.createClass({
  render() {
    return (
      <div className={classnames({
        "align-util-button": true,
        ["align-util-button--"+this.props.which]: true,
      })}
      
      onClick={() => {
        this.props.performAlign(this.props.which);
      }}
      >
        <div className="align-util-button__item" />
        <div className="align-util-button__item" />
      </div>
    );
  }
});

const SELECTION = 'SELECTION';
const CANVAS = 'CANVAS';

let AlignUtil = React.createClass({
  getInitialState() {
    return {
      mode: SELECTION
    }
  },

  renderModeButton() {
    let buttonIcon;
    let buttonHint;

    switch (this.state.mode) {
      case SELECTION:
        buttonIcon = (
          <svg>
            <rect x="6" y="6" width="16" height="16" />
            <rect x="4" y="4" width="4" height="4" />
            <rect x="4" y="20" width="4" height="4" />
            <rect x="20" y="4" width="4" height="4" />
            <rect x="20" y="20" width="4" height="4" />
          </svg>
        );
        buttonHint = 'Aligning to selection. Click to align to canvas.';
        break;
      case CANVAS:
        buttonIcon = (
          <svg>
            <rect x="4" y="4" width="20" height="20" />
          </svg>
        );
        buttonHint = 'Aligning to canvas. Click to align to selection.';
        break;
    }

    return (
      <a title={buttonHint} className="align-util-button align-util-mode-button" onClick={this.toggleMode}>
        {buttonIcon}
      </a>
    );
  },

  toggleMode() {
    this.setState({ mode: this.state.mode === SELECTION ? CANVAS : SELECTION });
  },

  performAlign(which) {
    let sb;
    
    switch (this.state.mode) {
      case SELECTION:
        sb = this.props.selectionBounds.bounds;
        break;
      case CANVAS:
        sb = this.props.editor.doc.bounds;
        break;
    }

    let as = [];
    for (let elem of this.props.selection) {
      let b = elem.bounds();
      let xd = 0;
      let yd = 0;

      // Determine xd
      switch (which) {
        case 'tl':
        case 'bl':
        case 'cl':
        case 'hl':
          xd = sb.l - b.l;
          break;
        case 'tc':
        case 'c':
        case 'bc':
        case 'hc':
          xd = sb.center().x - b.center().x;
          break;
        case 'tr':
        case 'br':
        case 'cr':
        case 'hr':
          xd = sb.r - b.r;
          break;
      }

      // Determine yd
      switch (which) {
        case 'tl':
        case 'tc':
        case 'tr':
        case 'vt':
          yd = sb.t - b.t;
          break;
        case 'cl':
        case 'c':
        case 'cr':
        case 'vc':
          yd = sb.center().y - b.center().y
          break;
        case 'bl':
        case 'bc':
        case 'br':
        case 'vb':
          yd = sb.b - b.b;
          break;
      }

      if (xd != 0 || yd != 0) {
        as.push(new actions.NudgeAction({
          indexes: [elem.index], xd, yd
        }));
      }

    }

    let frame = new HistoryFrame(as);
    frame.seal();

    this.props.editor.perform(frame);
  },

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

            <AlignUtilButton which="tl" performAlign={this.performAlign} />
            <AlignUtilButton which="tc" performAlign={this.performAlign} />
            <AlignUtilButton which="tr" performAlign={this.performAlign} />
            <AlignUtilButton which="cl" performAlign={this.performAlign} />
            <AlignUtilButton which="c" performAlign={this.performAlign} />
            <AlignUtilButton which="cr" performAlign={this.performAlign} />
            <AlignUtilButton which="bl" performAlign={this.performAlign} />
            <AlignUtilButton which="bc" performAlign={this.performAlign} />
            <AlignUtilButton which="br" performAlign={this.performAlign} />
          </div>
          <div id="align-util__1d-v">
            <svg className="align-util__guides">
              <line x1="50%" y1="20%" x2="50%" y2="80%" />
            </svg>

            <AlignUtilButton which="vt" performAlign={this.performAlign} />
            <AlignUtilButton which="vc" performAlign={this.performAlign} />
            <AlignUtilButton which="vb" performAlign={this.performAlign} />
          </div>
          <div id="align-util__1d-h">
            <svg className="align-util__guides">
              <line x1="20%" y1="50%" x2="80%" y2="50%" />
            </svg>

            <AlignUtilButton which="hl" performAlign={this.performAlign} />
            <AlignUtilButton which="hc" performAlign={this.performAlign} />
            <AlignUtilButton which="hr" performAlign={this.performAlign} />
          </div>
          <div id="align-util__scope-menu">
            {this.renderModeButton()}
          </div>
        </div>
      </Util>
    );
  }
});

export default AlignUtil;
