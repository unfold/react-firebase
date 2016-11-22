import React from 'react'
import { render } from 'react-dom'
import { initializeDemoDatabase } from '../common'
import Count from './Count'

const database = initializeDemoDatabase()

const App = () => (
  <Count database={database} />
)

render(<App />, document.getElementById('example'))
