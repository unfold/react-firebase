/* eslint-disable import/no-extraneous-dependencies */

import 'jsdom-global/register'
import React from 'react'
import test from 'tape'
import { findDOMNode, unmountComponentAtNode } from 'react-dom'
import { renderIntoDocument } from 'react-addons-test-utils'

import connect from '../connect'
import { firebaseAppShape } from '../../utils/PropTypes'

const createMockApp = (dataBaseProps, ...otherProps) => ({
  ...otherProps,
  database: () => dataBaseProps,
})

const FirebaseAppReceiver = () => <div />
FirebaseAppReceiver.propTypes = { firebase: firebaseAppShape }

test('Should throw if no Firebase app instance was found in either props or context', assert => {
  const errorPattern = /Could not find "firebase"/

  assert.throws(() => {
    const WrappedComponent = connect()(FirebaseAppReceiver)

    renderIntoDocument(<WrappedComponent />)
  }, errorPattern)

  assert.doesNotThrow(() => {
    const firebase = createMockApp({
      ref: () => true,
    })

    const WrappedComponent = connect()(FirebaseAppReceiver)

    renderIntoDocument(<WrappedComponent firebase={firebase} />)
  }, errorPattern)

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

  const firebase = createMockApp(mockDatabase)

  const mapPropsToSubscriptions = () => ({ foo: 'foo' })
  const WrappedComponent = connect(mapPropsToSubscriptions)(FirebaseAppReceiver)
  const container = renderIntoDocument(<WrappedComponent firebase={firebase} />)

  assert.deepEqual(container.state.subscriptionsState, { foo: 'foo changed' })
  assert.end()
})

test('Should subscribe to a query', assert => {
  const mockDatabase = {
    ref: path => {
      assert.equal(path, 'bar')

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

  const firebase = createMockApp(mockDatabase)

  const mapPropsToSubscriptions = () => ({ bar: ref => ref('bar').startAt(1) })
  const WrappedComponent = connect(mapPropsToSubscriptions)(FirebaseAppReceiver)
  const container = renderIntoDocument(<WrappedComponent firebase={firebase} />)

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

  const firebase = createMockApp(mockDatabase)

  const mapPropsToSubscriptions = () => ({ baz: 'baz' })
  const WrappedComponent = connect(mapPropsToSubscriptions)(FirebaseAppReceiver)
  const container = renderIntoDocument(<WrappedComponent firebase={firebase} />)

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
