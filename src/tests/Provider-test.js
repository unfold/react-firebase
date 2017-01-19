/* eslint-disable import/no-extraneous-dependencies */
import 'jsdom-global/register'
import React, { Component } from 'react'
import test from 'tape'
import { findRenderedComponentWithType, renderIntoDocument } from 'react-addons-test-utils'
import connect from '../connect'
import Provider from '../Provider'
import { createMockApp } from './helpers'

test('Should use firebaseApp from context if provided', assert => {
  class Passthrough extends Component { // eslint-disable-line react/prefer-stateless-function
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
