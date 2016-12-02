import { Component, PropTypes, Children } from 'react'
import { firebaseAppShape } from '../utils/PropTypes'

export default class Provider extends Component {
  static propTypes = {
    firebase: firebaseAppShape,
    children: PropTypes.element.isRequired,
  }

  static childContextTypes = {
    firebase: firebaseAppShape,
  }

  getChildContext() {
    return {
      firebase: this.props.firebase,
    }
  }

  render() {
    return Children.only(this.props.children)
  }
}
