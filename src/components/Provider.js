import { Component, PropTypes, Children } from 'react';
import firebaseShape from '../utils/firebaseShape';

export default class Provider extends Component {
  static propTypes = {
    firebase: firebaseShape,
    children: PropTypes.element.isRequired,
  }

  static childContextTypes = {
    firebase: firebaseShape,
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
