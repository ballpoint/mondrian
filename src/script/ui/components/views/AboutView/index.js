import 'views/about.scss';
import FixedHeader from 'ui/components/header';

class AboutView extends React.Component {
  constructor() {
    super();
  }

  render() {
    return (
      <div className="layout-fixed-width">
        <FixedHeader />
        <article>
          <p>
            Ballpoint is an experimental new vector graphics editor. It's
            available as a free to use web application.
          </p>
          <p>
            <h2>Features</h2>
            The current version has support for:
          </p>
          <ul>
            <li>Vector shapes composed of lines and cubic bezier curves</li>
            <li>Boolean operations on geometry</li>
            <li>Multi-line text blocks</li>
            <li>Undos/redos and other state persisted between sessions</li>
            <li>Pixel (digital) and point (print) based documents</li>
            <li>SVG import</li>
            <li>SVG, PDF, and PNG export</li>
            <li>
              BPS, "ballpoint source" file format which persists editor state
              like undo/redo history
            </li>
          </ul>
          <p>
            <h2>Examples</h2>
            Click below to try out a few example documents! Or,{' '}
            <a href="/files/local/new">create a new document</a> to start fresh.
          </p>
          <p>
            <a href="/files/examples/lego" className="example-doc">
              <img src="/assets/images/examples/ex1_lego.svg" height={200} />
              <sub>LEGO logo, imported from SVG</sub>
            </a>

            <a href="/files/examples/gumby-pippy" className="example-doc">
              <img
                src="/assets/images/examples/ex2_gumby_pippy.svg"
                height={200}
              />
              <sub>Gumby and Pippy, drawn from scratch (try undo/redo!)</sub>
            </a>
          </p>
        </article>
      </div>
    );
  }
}

export default AboutView;
