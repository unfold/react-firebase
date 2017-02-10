/* eslint-disable import/no-extraneous-dependencies */

import 'jsdom-global/register'
import React, { Component } from 'react'
import firebase from 'firebase/app'
import test from 'tape'
import { findDOMNode, unmountComponentAtNode } from 'react-dom'
import { findRenderedComponentWithType, renderIntoDocument } from 'react-addons-test-utils'
import connect from '../connect'
import { createMockApp, createMockSnapshot } from './helpers'

const renderStub = (mapFirebaseToProps, firebaseApp, props) => {
  class Passthrough extends Component { // eslint-disable-line react/prefer-stateless-function
    render() {
      return <div />
    }
  }

  const WrappedComponent = connect(mapFirebaseToProps)(Passthrough)
  const container = renderIntoDocument(<WrappedComponent {...props} firebaseApp={firebaseApp} />)
  const stub = findRenderedComponentWithType(container, Passthrough)

  return {
    container,
    props: stub.props,
    state: container.state.subscriptionsState,
  }
}

test('Should throw if no initialized Firebase app instance was found', assert => {
  const errorPattern = /No Firebase App/

  // Default app instance
  assert.doesNotThrow(() => {
    const defaultApp = firebase.initializeApp({})
    const WrappedComponent = connect()('div')
    const container = renderIntoDocument(<WrappedComponent />)
    const stub = findRenderedComponentWithType(container, WrappedComponent)

    assert.equal(stub.firebaseApp, defaultApp)

    defaultApp.delete()
  }, errorPattern)

  // Props
  assert.doesNotThrow(() => {
    const firebaseApp = createMockApp()
    const WrappedComponent = connect()(props => {
      assert.equal(props.firebaseApp, firebaseApp)

      return <div />
    })

    renderIntoDocument(<WrappedComponent firebaseApp={firebaseApp} />)
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
      callback(createMockSnapshot('foo value'))
    },
  }

  const mapFirebaseToProps = () => ({ foo: 'foo' })
  const firebaseApp = createMockApp(mockDatabase)
  const { state, props } = renderStub(mapFirebaseToProps, firebaseApp)

  assert.deepEqual(state, { foo: 'foo value' })
  assert.equal(props.foo, 'foo value')
  assert.end()
})

test('Should subscribe to a query', assert => {
  const mockDatabase = {
    ref: path => {
      assert.equal(path, 'bar')

      return mockDatabase
    },
    startAt: value => {
      assert.equal(value, 1)

      return mockDatabase
    },
    endAt: (value, key) => {
      assert.equal(value, 2)
      assert.equal(key, 'car')

      return mockDatabase
    },
    on: (event, callback) => {
      assert.equal(event, 'value')
      callback(createMockSnapshot('bar value'))
    },
  }

  const mapFirebaseToProps = () => ({
    bar: {
      path: 'bar',
      startAt: 1,
      endAt: [2, 'car'],
    },
  })

  const firebaseApp = createMockApp(mockDatabase)
  const { state, props } = renderStub(mapFirebaseToProps, firebaseApp)

  assert.deepEqual(state, { bar: 'bar value' })
  assert.equal(props.bar, 'bar value')
  assert.end()
})

test('Should not subscribe to functions', assert => {
  const mapFirebaseToProps = (props, ref) => ({
    foo: 'foo',
    addFoo: name => ref('foo').push(name),
  })

  const firebaseApp = createMockApp()
  const { state, props } = renderStub(mapFirebaseToProps, firebaseApp)

  assert.deepEqual(state, { foo: 'foo value' })
  assert.equal(props.foo, 'foo value')
  assert.equal(typeof props.addFoo, 'function')
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
      callback(createMockSnapshot('baz value'))
    },
    off: event => {
      assert.equal(event, 'value')
    },
  }

  const mapFirebaseToProps = () => ({ baz: 'baz' })
  const firebaseApp = createMockApp(mockDatabase)
  const { container } = renderStub(mapFirebaseToProps, firebaseApp)

  assert.notEqual(container.listeners.baz, undefined)
  unmountComponentAtNode(findDOMNode(container).parentNode)
  assert.equal(container.listeners.baz, undefined)

  assert.end()
})

test('Should pass props, ref and firebaseApp to mapFirebaseToProps', assert => {
  const mapFirebaseToProps = (props, ref, firebaseApp) => {
    assert.deepEqual(props.foo, 'foo prop')
    assert.equal(typeof firebaseApp.database, 'function')
    assert.equal(typeof ref, 'function')

    return { foo: 'foo' }
  }

  const firebaseApp = createMockApp()
  const { props } = renderStub(mapFirebaseToProps, firebaseApp, { foo: 'foo prop' })

  assert.equal(props.foo, 'foo value')
  assert.end()
})

test('Should update subscriptions when props change', assert => {
  const mapFirebaseToProps = props => ({ foo: props.foo, bar: props.bar })

  const firebaseApp = createMockApp()
  const initial = renderStub(mapFirebaseToProps, firebaseApp, { foo: 'foo' })
  assert.equal(initial.props.foo, 'foo value')
  assert.equal(initial.props.bar, undefined)

  const added = renderStub(mapFirebaseToProps, firebaseApp, { foo: 'foo', bar: 'bar' })
  assert.equal(added.props.foo, 'foo value')
  assert.equal(added.props.bar, 'bar value')

  const changed = renderStub(mapFirebaseToProps, firebaseApp, { foo: 'foo', bar: 'baz' })
  assert.equal(changed.props.foo, 'foo value')
  assert.equal(changed.props.bar, 'baz value')

  const removed = renderStub(mapFirebaseToProps, firebaseApp, { bar: 'baz' })
  assert.equal(removed.props.foo, undefined)
  assert.equal(removed.props.bar, 'baz value')

  assert.end()
})
