class FixedHeader extends React.Component {
  render() {
    return (
      <header>
        <h1>
          <a title="Ballpoint Editor" href="/">
            <img width={40} height={40} src="/assets/images/logo.svg" />
            Ballpoint
          </a>
        </h1>
        <a id="launch-cta" href="/files/local/new">
          Launch Editor
        </a>
      </header>
    );
  }
}

export default FixedHeader;
