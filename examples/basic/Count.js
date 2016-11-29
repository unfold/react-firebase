import React, { PropTypes } from 'react'
import { partial } from 'lodash'
import { connect } from '../../src'
import { getSandboxedPath } from '../common'

const countPath = getSandboxedPath('count')

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

const mapPropsToSubscriptions = () => ({ count: countPath })
const mapRefToProps = ref => ({
  setCount: count => ref(countPath).set(count),
})

export default connect(mapPropsToSubscriptions, mapRefToProps)(Count)
