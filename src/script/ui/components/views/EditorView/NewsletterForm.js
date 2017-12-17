import request from 'superagent';

class NewsletterForm extends React.Component {
  constructor() {
    super();

    this.state = {
      pending: false
    };
  }

  onSubmit(e) {
    e.preventDefault();

    let email = e.target.querySelector('[name=email]').value;

    console.log(email);

    this.setState({ pending: true });

    request
      .post('/newsletter/subscribe')
      .send({ email })
      .end((err, res) => {
        console.log(err, res);
        this.setState({ pending: false });
      });
  }

  render() {
    return (
      <div id="app-newsletter">
        <i>
          This is new software, under active development.<br />Subscribe for
          periodic email updates (every month or two)
        </i>
        <form
          onSubmit={this.onSubmit.bind(this)}
          method="POST"
          action="/newsletter/subscribe">
          <input type="email" placeholder="Email address" name="email" />
          <input
            disabled={this.state.pending}
            type="submit"
            value="Subscribe"
          />
        </form>
      </div>
    );
  }
}

export default NewsletterForm;
