import React from 'react'
import { render } from 'react-dom'
import { initializeDemoApp } from '../common'
import Count from './Count'

const firebase = initializeDemoApp()

const App = () => (
  <Count firebase={firebase} />
)

render(<App />, document.getElementById('example'))
