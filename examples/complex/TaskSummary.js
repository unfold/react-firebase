import PropTypes from 'prop-types'
import React from 'react'
import { connect } from '../../src'
import { getSandboxedPath } from '../common'

const tasksPath = getSandboxedPath('complex/tasks')

const TaskSummary = ({ name, description, outside }) => (
  <span>{name} - {description} - {outside ? '🌞' : '🏨'}</span>
)

TaskSummary.propTypes = {
  name: PropTypes.string,
  description: PropTypes.string,
  outside: PropTypes.bool,
}

const mapFirebaseToProps = ({ taskId }) => ({
  name: `${tasksPath}/${taskId}/name`,
  description: `${tasksPath}/${taskId}/description`,
  outside: `${tasksPath}/${taskId}/outside`,
})

export default connect(mapFirebaseToProps)(TaskSummary)
