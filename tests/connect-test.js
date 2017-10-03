/* eslint-disable import/no-extraneous-dependencies, react/no-find-dom-node */

import 'jsdom-global/register'
import React, { Component } from 'react'
import firebase from 'firebase/app'
import test from 'tape'
import { findDOMNode, unmountComponentAtNode } from 'react-dom'
import { findRenderedComponentWithType, renderIntoDocument } from 'react-addons-test-utils'
import connect from '../src/connect'
import { createMockApp, createMockSnapshot } from './helpers'

const renderStub = ({ mapFirebaseToProps, mergeProps, firebaseApp }, initialProps) => {
  // eslint-disable-next-line react/prefer-stateless-function
  class WrappedComponent extends Component {
    render() {
      return <div />
    }
  }

  const ConnectedComponent = connect(mapFirebaseToProps, mergeProps)(WrappedComponent)

  // eslint-disable-next-line react/no-multi-comp
  class ParentComponent extends Component {
    state = {
      childProps: initialProps,
    }

    render() {
      return (
        <ConnectedComponent
          {...this.state.childProps}
          ref={ref => (this.connectedComponent = ref)}
          firebaseApp={firebaseApp}
        />
      )
    }
  }

  const parentComponent = renderIntoDocument(<ParentComponent />)
  const connectedComponent = parentComponent.connectedComponent
  const wrappedComponent = findRenderedComponentWithType(parentComponent, WrappedComponent)

  return {
    getSubscriptionState: () => connectedComponent.state.subscriptionsState,
    getProps: () => wrappedComponent.props,
    getListeners: () => connectedComponent.listeners,
    setProps: props => parentComponent.setState({ childProps: props }),
    unmount: () => unmountComponentAtNode(findDOMNode(parentComponent).parentNode),
  }
}

test('Should throw if no initialized Firebase app instance was found', assert => {
  const errorPattern = /No Firebase App/

  // Default app instance
  assert.doesNotThrow(() => {
    const defaultApp = firebase.initializeApp({})
    const WrappedComponent = connect()(() => <div />)
    const connectedComponent = renderIntoDocument(<WrappedComponent />)
    const stub = findRenderedComponentWithType(connectedComponent, WrappedComponent)

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
      callback(createMockSnapshot({ bar: 'bar' }))
    },
  }

  const mapFirebaseToProps = () => ({ foo: 'foo' })
  const firebaseApp = createMockApp(mockDatabase)
  const stub = renderStub({ mapFirebaseToProps, firebaseApp })

  assert.deepEqual(stub.getSubscriptionState(), { foo: { bar: 'bar' } })
  assert.deepEqual(stub.getProps().foo, { bar: 'bar' })
  assert.end()
})

test('Should return null if a subscribed path does not exist', assert => {
  const mockDatabase = {
    ref: path => {
      assert.equal(path, 'foo')

      return mockDatabase
    },
    on: (event, callback) => {
      assert.equal(event, 'value')
      callback(createMockSnapshot(null))
    },
  }

  const mapFirebaseToProps = () => ({ foo: 'foo' })
  const firebaseApp = createMockApp(mockDatabase)
  const stub = renderStub({ mapFirebaseToProps, firebaseApp })

  assert.deepEqual(stub.getSubscriptionState(), { foo: null })
  assert.equal(stub.getProps().foo, null)
  assert.end()
})

test('Should not pass unresolved subscriptions from result of mapFirebaseToProps', assert => {
  const mockDatabase = {
    ref: path => {
      assert.equal(path, 'foo')

      return mockDatabase
    },
    on: event => {
      assert.equal(event, 'value')
    },
  }

  const mapFirebaseToProps = () => ({ foo: 'foo' })
  const firebaseApp = createMockApp(mockDatabase)
  const stub = renderStub({ mapFirebaseToProps, firebaseApp })

  assert.equal(stub.getSubscriptionState(), null)
  assert.equal(stub.getProps().foo, undefined)
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
  const stub = renderStub({ mapFirebaseToProps, firebaseApp })

  assert.deepEqual(stub.getSubscriptionState(), { bar: 'bar value' })
  assert.equal(stub.getProps().bar, 'bar value')
  assert.end()
})

test('Should correctly order subscription values if orderByChild was passed to query', assert => {
  const mockDatabase = {
    ref: path => {
      assert.equal(path, 'bar')

      return mockDatabase
    },
    orderByChild: value => {
      assert.equal(value, 'order')

      return mockDatabase
    },
    on: (event, callback) => {
      assert.equal(event, 'value')

      const snapshot = {
        val: () => ({
          alpha: { order: 3 },
          beta: { order: 2 },
          gamma: { order: 1 },
        }),

        forEach: iterator => {
          iterator({ key: 'gamma', val: () => ({ order: 1 }) })
          iterator({ key: 'beta', val: () => ({ order: 2 }) })
          iterator({ key: 'alpha', val: () => ({ order: 3 }) })
        },
      }

      callback(snapshot)
    },
  }

  const mapFirebaseToProps = () => ({
    bar: {
      path: 'bar',
      orderByChild: 'order',
    },
  })

  const firebaseApp = createMockApp(mockDatabase)
  const stub = renderStub({ mapFirebaseToProps, firebaseApp })

  assert.deepEqual(Object.keys(stub.getSubscriptionState().bar), ['gamma', 'beta', 'alpha'])
  assert.deepEqual(Object.keys(stub.getProps().bar), ['gamma', 'beta', 'alpha'])
  assert.end()
})

test('Should not subscribe to functions', assert => {
  const mapFirebaseToProps = (props, ref) => ({
    foo: 'foo',
    addFoo: name => ref('foo').push(name),
  })

  const firebaseApp = createMockApp()
  const stub = renderStub({ mapFirebaseToProps, firebaseApp })

  assert.deepEqual(stub.getSubscriptionState(), { foo: 'foo value' })
  assert.equal(stub.getProps().foo, 'foo value')
  assert.equal(typeof stub.getProps().addFoo, 'function')
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
  const stub = renderStub({ mapFirebaseToProps, firebaseApp })

  assert.notEqual(stub.getListeners().baz, undefined)
  assert.equal(stub.unmount(), true)
  assert.equal(stub.getListeners().baz, undefined)
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
  const stub = renderStub({ mapFirebaseToProps, firebaseApp }, { foo: 'foo prop' })

  assert.equal(stub.getProps().foo, 'foo value')
  assert.end()
})

test('Should update subscriptions when props change', assert => {
  const mapFirebaseToProps = props => ({ foo: props.foo, bar: props.bar })
  const firebaseApp = createMockApp()
  const stub = renderStub({ mapFirebaseToProps, firebaseApp })

  stub.setProps({ foo: 'foo' })
  assert.equal(stub.getProps().foo, 'foo value')
  assert.equal(stub.getProps().bar, undefined)
  assert.equal(stub.getListeners().foo.path, 'foo')
  assert.equal(stub.getListeners().bar, undefined)

  stub.setProps({ foo: 'foo', bar: 'bar' })
  assert.equal(stub.getProps().foo, 'foo value')
  assert.equal(stub.getProps().bar, 'bar value')
  assert.equal(stub.getListeners().foo.path, 'foo')
  assert.equal(stub.getListeners().bar.path, 'bar')

  stub.setProps({ foo: 'foo', bar: 'baz' })
  assert.equal(stub.getProps().foo, 'foo value')
  assert.equal(stub.getProps().bar, 'baz value')
  assert.equal(stub.getListeners().foo.path, 'foo')
  assert.equal(stub.getListeners().bar.path, 'baz')

  stub.setProps({ bar: 'baz' })
  assert.equal(stub.getProps().foo, undefined)
  assert.equal(stub.getProps().bar, 'baz value')
  assert.equal(stub.getListeners().foo, undefined)
  assert.equal(stub.getListeners().bar.path, 'baz')

  assert.end()
})

test('Should use custom mergeProps function if provided', assert => {
  const mapFirebaseToProps = props => ({ foo: props.foo })
  const mergeProps = () => ({ bar: 'bar merge props' })

  const firebaseApp = createMockApp()
  const stub = renderStub({ mapFirebaseToProps, mergeProps, firebaseApp }, { foo: 'foo prop' })

  assert.deepEqual(stub.getProps(), { bar: 'bar merge props' })
  assert.end()
})
