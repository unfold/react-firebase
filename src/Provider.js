import { Component, PropTypes, Children } from 'react'

export default class Provider extends Component {
  static propTypes = {
    firebaseApp: PropTypes.object.isRequired,
    children: PropTypes.element.isRequired,
  }

  static childContextTypes = {
    firebaseApp: PropTypes.object,
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
