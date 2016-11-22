import React, { PropTypes } from 'react'
import { partial } from 'lodash'
import { connect } from '../../src'

const Count = ({ count, setCount }) => (
  <div>
    <p>Count: {count || 0}</p>

    <button onClick={partial(setCount, count - 1)}>Decrement</button>
    <button onClick={partial(setCount, count + 1)}>Increment</button>
  </div>
)

Count.propTypes = {
  count: PropTypes.number,
  setCount: PropTypes.func.isRequired,
}

const mapPropsToSubscriptions = () => ({ count: 'count' })
const mapFirebaseToProps = ({ database }) => ({
  setCount: count => database().ref('count').set(count),
})

export default connect(mapPropsToSubscriptions, mapFirebaseToProps)(Count)
