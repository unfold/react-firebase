import React from 'react'
import { render } from 'react-dom'
import { initializeDemoApp } from '../common'
import Count from './Count'

initializeDemoApp()

render(<Count />, document.getElementById('example'))
