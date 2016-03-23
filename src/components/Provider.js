import { Component, PropTypes, Children } from 'react';
import Firebase from 'firebase';

export default class Provider extends Component {
  static propTypes = {
    firebase: PropTypes.instanceOf(Firebase),
    children: PropTypes.element.isRequired,
  }

  static childContextTypes = {
    firebase: PropTypes.instanceOf(Firebase),
  }

  getChildContext() {
    return {
      firebase: this.props.firebase,
    };
  }

  render() {
    return Children.only(this.props.children);
  }
}
