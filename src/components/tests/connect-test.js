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

test('Should throw if no Firebase app instance was found in either props or context', assert => {
  const errorPattern = /Could not find "firebase"/

  assert.throws(() => {
    const WrappedComponent = connect()('div')

    renderIntoDocument(<WrappedComponent />)
  }, errorPattern)

  assert.doesNotThrow(() => {
    const firebase = createMockApp()
    const WrappedComponent = connect()(props => {
      assert.equal(props.firebase, firebase)

      return <div />
    })

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
      callback(createMockSnapshot('foo value'))
    },
  }

  const mapPropsToSubscriptions = () => ({ foo: 'foo' })
  const WrappedComponent = connect(mapPropsToSubscriptions)(Passthrough)

  const firebase = createMockApp(mockDatabase)
  const container = renderIntoDocument(<WrappedComponent firebase={firebase} />)
  const stub = findRenderedComponentWithType(container, Passthrough)

  assert.deepEqual(container.state.subscriptionsState, { foo: 'foo value' })
  assert.equal(stub.props.foo, 'foo value')
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
      callback(createMockSnapshot('bar value'))
    },
  }

  const mapPropsToSubscriptions = () => ({ bar: ref => ref('bar').startAt(1) })
  const WrappedComponent = connect(mapPropsToSubscriptions)(Passthrough)

  const firebase = createMockApp(mockDatabase)
  const container = renderIntoDocument(<WrappedComponent firebase={firebase} />)
  const stub = findRenderedComponentWithType(container, Passthrough)

  assert.deepEqual(container.state.subscriptionsState, { bar: 'bar value' })
  assert.equal(stub.props.bar, 'bar value')
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

  const mapPropsToSubscriptions = () => ({ baz: 'baz' })
  const WrappedComponent = connect(mapPropsToSubscriptions)(Passthrough)
  const firebase = createMockApp(mockDatabase)
  const container = renderIntoDocument(<WrappedComponent firebase={firebase} />)

  unmountComponentAtNode(findDOMNode(container).parentNode)

  assert.end()
})

test('Should subscribe to nested paths', assert => {
  const mapPropsToSubscriptions = () => ({
    user: {
      name: 'user/name',
      photo: 'user/photo/url',
      address: {
        street: 'user/address/street',
      },
    },
  })

  const WrappedComponent = connect(mapPropsToSubscriptions)(Passthrough)
  const firebase = createMockApp()
  const container = renderIntoDocument(<WrappedComponent firebase={firebase} />)
  const stub = findRenderedComponentWithType(container, Passthrough)

  assert.deepEqual(container.state.subscriptionsState, {
    'user.name': 'user/name value',
    'user.photo': 'user/photo/url value',
    'user.address.street': 'user/address/street value',
  })

  assert.deepEqual(stub.props.user, {
    name: 'user/name value',
    photo: 'user/photo/url value',
    address: {
      street: 'user/address/street value',
    },
  })

  assert.end()
})

test('Should pass ref, props and firebase to mapPropsToSubscriptions', assert => {
  const mapPropsToSubscriptions = (ref, props, firebase) => {
    assert.deepEqual(props.foo, 'foo prop')
    assert.equal(typeof firebase.database, 'function')
    assert.equal(typeof ref, 'function')

    return { foo: 'foo' }
  }

  const firebase = createMockApp()
  const WrappedComponent = connect(mapPropsToSubscriptions)(Passthrough)
  const container = renderIntoDocument(<WrappedComponent firebase={firebase} foo="foo prop" />)
  const stub = findRenderedComponentWithType(container, Passthrough)

  assert.equal(stub.props.foo, 'foo value')
  assert.end()
})

test('Should pass ref, props and firebase to mapFirebaseToProps', assert => {
  const mapFirebaseToProps = (ref, props, firebase) => {
    assert.deepEqual(props.bar, 'bar prop')
    assert.equal(typeof firebase.database, 'function')
    assert.equal(typeof ref, 'function')

    return {
      bar: value => ref.set('bar', value),
    }
  }

  const firebase = createMockApp()
  const WrappedComponent = connect(null, mapFirebaseToProps)(Passthrough)
  const container = renderIntoDocument(<WrappedComponent firebase={firebase} bar="bar prop" />)
  const stub = findRenderedComponentWithType(container, Passthrough)

  assert.equal(typeof stub.props.bar, 'function')
  assert.end()
})

test('Should update subscriptions when props change')
test('Should not re-render if options.pure is true')
test('Should re-render if options.pure is false')
test('Should merge using mergeProps function')
test('Should keep connection to Firebase alive when specified and ignore later updates')
