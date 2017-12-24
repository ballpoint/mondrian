import 'logo.scss';

class Logo extends React.Component {
  render() {
    return (
      <svg id="logo" width="40" height="40">
        <rect x="0" y="0" width="40" height="40" className="logo-bg" />
        <rect x="6" y="8" width="6" height="22" className="logo-fg" />
        <rect x="17" y="8" width="6" height="10" className="logo-fg" />
        <rect x="28" y="8" width="6" height="22" className="logo-fg" />
      </svg>
    );
  }
}

export default Logo;
