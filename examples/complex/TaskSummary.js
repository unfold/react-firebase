import React, { PropTypes } from 'react'
import { connect } from '../../src'
import { getSandboxedPath } from '../common'

const tasksPath = getSandboxedPath('complex/tasks')

const TaskSummary = ({ name, description, flags = {} }) => (
  <span>{name} - {description} - {flags.outside ? '🌞' : '🏨'}</span>
)

TaskSummary.propTypes = {
  name: PropTypes.string,
  description: PropTypes.string,
  flags: PropTypes.object,
}

const mapPropsToSubscriptions = ({ taskId }) => ({
  name: `${tasksPath}/${taskId}/name`,
  description: `${tasksPath}/${taskId}/description`,
  flags: {
    outside: `${tasksPath}/${taskId}/outside`,
  },
})

export default connect(mapPropsToSubscriptions)(TaskSummary)
