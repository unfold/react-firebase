import PropTypes from 'prop-types'
import React from 'react'
import { connect } from '../../src'
import { getSandboxedPath } from '../common'

const countPath = getSandboxedPath('count')

const Count = ({ count = 0, setCount }) => (
  <div>
    <p>Count: {count}</p>

    <button onClick={() => setCount(count - 1)}>Decrement</button>
    <button onClick={() => setCount(count + 1)}>Increment</button>
  </div>
)

Count.propTypes = {
  count: PropTypes.number,
  setCount: PropTypes.func.isRequired,
}

const mapFirebaseToProps = (props, ref) => ({
  count: countPath,
  setCount: count => ref(countPath).set(count),
})

export default connect(mapFirebaseToProps)(Count)
