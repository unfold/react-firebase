import React, { PropTypes } from 'react'
import { connect } from '../../src'

const TaskSummary = ({ name, description, flags = {} }) => (
  <span>{name} - {description} - {flags.outside ? '🌞' : '🏨'}</span>
)

TaskSummary.propTypes = {
  name: PropTypes.string,
  description: PropTypes.string,
  flags: PropTypes.object,
}

const mapPropsToSubscriptions = ({ taskId }) => ({
  name: `tasks/${taskId}/name`,
  description: `tasks/${taskId}/description`,
  flags: {
    outside: `tasks/${taskId}/outside`,
  },
})

export default connect(mapPropsToSubscriptions)(TaskSummary)
