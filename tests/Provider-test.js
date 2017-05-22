/* eslint-disable import/no-extraneous-dependencies */
import 'jsdom-global/register'
import React, { Component } from 'react'
import test from 'tape'
import { findRenderedComponentWithType, renderIntoDocument } from 'react-addons-test-utils'
import connect from '../src/connect'
import Provider from '../src/Provider'
import { createMockApp } from './helpers'

test('Should use firebaseApp from context if provided', assert => {
  // eslint-disable-next-line react/prefer-stateless-function
  class Passthrough extends Component {
    render() {
      return <div />
    }
  }

  const firebaseApp = createMockApp()
  const WrappedComponent = connect()(Passthrough)
  const container = renderIntoDocument(
    <Provider firebaseApp={firebaseApp}>
      <WrappedComponent />
    </Provider>
  )

  const stub = findRenderedComponentWithType(container, WrappedComponent)

  assert.equal(stub.firebaseApp, firebaseApp)
  assert.end()
})
