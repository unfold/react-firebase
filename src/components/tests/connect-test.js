/* eslint-disable import/no-extraneous-dependencies */

import 'jsdom-global/register'
import React from 'react'
import test from 'tape'
import { findDOMNode, unmountComponentAtNode } from 'react-dom'
import { renderIntoDocument } from 'react-addons-test-utils'

import connect from '../connect'
import { databaseShape } from '../../utils/PropTypes'

const DatabaseReceiver = () => <div />
DatabaseReceiver.propTypes = { database: databaseShape }

test('Should throw if no database instance was found in either props or context', assert => {
  assert.throws(() => {
    const WrappedComponent = connect()(DatabaseReceiver)

    renderIntoDocument(<WrappedComponent />)
  }, /Could not find "database"/)

  assert.doesNotThrow(() => {
    const mockDatabase = {
      ref: () => true,
    }

    const WrappedComponent = connect()(DatabaseReceiver)

    renderIntoDocument(<WrappedComponent database={mockDatabase} />)
  }, /Could not find "firebase"/)

  assert.end()
})

test('Should subscribe to a single path', assert => {
  const mockDatabase = {
    ref: path => {
      assert.equal(path, 'foo')

      return mockDatabase
    },
    on: (event, callback) => {
      assert.equal(event, 'value')

      const mockSnapshot = {
        val: () => 'foo changed',
      }

      callback(mockSnapshot)
    },
  }

  const mapPropsToSubscriptions = () => ({ foo: 'foo' })
  const WrappedComponent = connect(mapPropsToSubscriptions)(DatabaseReceiver)
  const container = renderIntoDocument(<WrappedComponent database={mockDatabase} />)

  assert.deepEqual(container.state.subscriptionsState, { foo: 'foo changed' })
  assert.end()
})

test('Should subscribe to a query', assert => {
  const mockDatabase = {
    ref: () => {
      assert.fail()

      return mockDatabase
    },
    startAt: priority => {
      assert.equal(priority, 1)

      return mockDatabase
    },
    on: (event, callback) => {
      assert.equal(event, 'value')

      const mockSnapshot = {
        val: () => 'bar changed',
      }

      callback(mockSnapshot)
    },
  }

  const mapPropsToSubscriptions = () => ({ bar: firebase => firebase.startAt(1) })
  const WrappedComponent = connect(mapPropsToSubscriptions)(DatabaseReceiver)
  const container = renderIntoDocument(<WrappedComponent database={mockDatabase} />)

  assert.deepEqual(container.state.subscriptionsState, { bar: 'bar changed' })
  assert.end()
})

test('Should unsubscribe when component unmounts', assert => {
  const mockDatabase = {
    ref: path => {
      assert.equal(path, 'baz')

      return mockDatabase
    },
    on: (event, callback) => {
      assert.equal(event, 'value')

      const mockSnapshot = {
        val: () => 'baz changed',
      }

      callback(mockSnapshot)
    },
    off: event => {
      assert.equal(event, 'value')
    },
  }

  const mapPropsToSubscriptions = () => ({ baz: 'baz' })
  const WrappedComponent = connect(mapPropsToSubscriptions)(DatabaseReceiver)
  const container = renderIntoDocument(<WrappedComponent database={mockDatabase} />)

  assert.deepEqual(container.state.subscriptionsState, { baz: 'baz changed' })

  unmountComponentAtNode(findDOMNode(container).parentNode)

  assert.end()
})

test('Should subscribe to nested paths')
test('Should map firebase to props')
test('Should keep connection to Firebase alive when specified and ignore later updates')
test('Should update subscriptions when props change')
test('Should not re-render if options.pure is true')
test('Should re-render if options.pure is false')
test('Should merge using mergeProps function')
