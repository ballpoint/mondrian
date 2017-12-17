import localForage from 'localforage';
import request from 'superagent';
import { renderIcon } from 'ui/components/icons';
import Cookies from 'js-cookie';

class NewsletterForm extends React.Component {
  constructor() {
    super();

    let dismissed = !!Cookies.get('newsletter-dismissed');

    dismissed = true; // TODO remove

    this.state = {
      pending: false,
      confirming: false,
      dismissed
    };
  }

  dismiss() {
    this.setState({ dismissed: true });
    this.persistDismiss();
  }

  persistDismiss() {
    Cookies.set('newsletter-dismissed', 1, { expires: 365 * 100 });
  }

  onSubmit(e) {
    e.preventDefault();

    let email = e.target.querySelector('[name=email]').value;

    if (email === '' || !/.*@.*/.test(email)) {
      return;
    }

    this.setState({ pending: true });

    request
      .post('/newsletter/subscribe')
      .send({ email })
      .end((err, res) => {
        console.log(err, res);
        this.persistDismiss();
        this.setState({ pending: false, confirming: true });
      });
  }

  render() {
    if (this.state.dismissed) return null;

    if (this.state.confirming) {
      return (
        <div id="app-newsletter">
          {"Thanks for your interest! We'll send you a confirmation email."}
          <button onClick={this.dismiss.bind(this)}>OK</button>
          <div id="app-newsletter__close" onClick={this.dismiss.bind(this)}>
            {renderIcon('del', { width: 14, height: 14, padding: 4 })}
          </div>
        </div>
      );
    } else {
      return (
        <div id="app-newsletter">
          <i>
            This is new software, under active development.<br />Subscribe for
            periodic email updates (every month or two).
          </i>
          <form
            onSubmit={this.onSubmit.bind(this)}
            method="POST"
            action="/newsletter/subscribe">
            <input
              type="email"
              placeholder="Email address"
              name="email"
              required
            />
            <input
              disabled={this.state.pending}
              type="submit"
              value="Subscribe"
            />
          </form>
          <div id="app-newsletter__close" onClick={this.dismiss.bind(this)}>
            {renderIcon('del', { width: 14, height: 14, padding: 4 })}
          </div>
        </div>
      );
    }
  }
}

export default NewsletterForm;
