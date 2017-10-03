import PropTypes from 'prop-types'
import { Component, Children } from 'react'
import firebase from 'firebase/app'

export default class Provider extends Component {
  static propTypes = {
    firebaseApp: PropTypes.object.isRequired,
    children: PropTypes.element.isRequired,
  }

  static childContextTypes = {
    firebaseApp: PropTypes.instanceOf(firebase.app.App),
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
