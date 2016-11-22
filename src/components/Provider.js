import { Component, PropTypes, Children } from 'react'
import { databaseShape } from '../utils/PropTypes'

export default class Provider extends Component {
  static propTypes = {
    database: databaseShape,
    children: PropTypes.element.isRequired,
  }

  static childContextTypes = {
    database: databaseShape,
  }

  getChildContext() {
    return {
      database: this.props.database,
    }
  }

  render() {
    return Children.only(this.props.children)
  }
}
