import { Component, PropTypes, Children } from 'react'
import { firebaseAppShape } from './PropTypes'

export default class Provider extends Component {
  static propTypes = {
    firebaseApp: firebaseAppShape,
    children: PropTypes.element.isRequired,
  }

  static childContextTypes = {
    firebaseApp: firebaseAppShape,
  }

  getChildContext() {
    return {
      firebaseApp: this.props.firebaseApp,
    }
  }

  render() {
    return Children.only(this.props.children)
  }
}
