import React from 'react'
import { render } from 'react-dom'
import Count from './Count'
import initializeDemoApp from '../initializeDemoApp'

const firebase = initializeDemoApp()

const App = () => (
  <Count firebase={firebase} />
)

render(<App />, document.getElementById('example'))
