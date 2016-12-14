/* eslint-disable import/no-extraneous-dependencies */

import 'jsdom-global/register'
import React, { Component } from 'react'
import test from 'tape'
import { findDOMNode, unmountComponentAtNode } from 'react-dom'
import { findRenderedComponentWithType, renderIntoDocument } from 'react-addons-test-utils'

import connect from '../connect'

class Passthrough extends Component { // eslint-disable-line react/prefer-stateless-function
  render() {
    return <div />
  }
}

const createMockSnapshot = (val, ...otherProps) => ({
  ...otherProps,
  val: () => val,
})

const defaultDatabaseProps = {
  ref: path => ({
    on: (event, callback) => (
      callback(createMockSnapshot(`${path} value`))
    ),
  }),
}

const createMockApp = (dataBaseProps = defaultDatabaseProps, ...otherProps) => ({
  ...otherProps,
  database: () => dataBaseProps,
})

const renderStub = (mapFirebaseToProps, firebaseApp, props) => {
  const WrappedComponent = connect(mapFirebaseToProps)(Passthrough)
  const container = renderIntoDocument(<WrappedComponent {...props} firebaseApp={firebaseApp} />)
  const stub = findRenderedComponentWithType(container, Passthrough)

  return {
    container,
    props: stub.props,
    state: container.state.subscriptionsState,
  }
}

test('Should throw if no Firebase app instance was found either globally, in props or context', assert => {
  const errorPattern = /No Firebase App/

  assert.throws(() => {
    const WrappedComponent = connect()('div')

    renderIntoDocument(<WrappedComponent />)
  }, errorPattern)

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

  unmountComponentAtNode(findDOMNode(container).parentNode)

  assert.end()
})

test('Should pass props, ref and firebase to mapFirebaseToProps', assert => {
  const mapFirebaseToProps = (props, ref, firebase) => {
    assert.deepEqual(props.foo, 'foo prop')
    assert.equal(typeof firebase.database, 'function')
    assert.equal(typeof ref, 'function')

    return { foo: 'foo' }
  }

  const firebaseApp = createMockApp()
  const { props } = renderStub(mapFirebaseToProps, firebaseApp, { foo: 'foo prop' })

  assert.equal(props.foo, 'foo value')
  assert.end()
})

test('Should update subscriptions when props change')
