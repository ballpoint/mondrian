import Logo from 'ui/components/views/Logo';

class FixedHeader extends React.Component {
  render() {
    return (
      <header>
        <div id="logo-container">
          <a href="/">
            <img src="/assets/images/logo.svg" />
            fuck
          </a>
        </div>
      </header>
    );
  }
}

export default FixedHeader;
