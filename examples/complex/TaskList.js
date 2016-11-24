import React, { PropTypes } from 'react'
import { map } from 'lodash'
import { connect } from '../../src'
import { getSandboxedPath } from '../common'
import TaskSummary from './TaskSummary'

const tasksPath = getSandboxedPath('complex/tasks')

const TaskListItem = ({ taskId }) => (
  <li><TaskSummary taskId={taskId} /></li>
)

TaskListItem.propTypes = {
  taskId: PropTypes.string.isRequired,
}

const TaskList = ({ tasks }) => (
  <div>
    <ul>
      {map(tasks, (task, key) => <TaskListItem key={key} taskId={key} />)}
    </ul>
  </div>
)

TaskList.propTypes = {
  tasks: PropTypes.object,
}

const mapPropsToSubscriptions = ({ outside }) => {
  if (outside) {
    return {
      tasks: ref => ref(tasksPath).orderByChild('outside').equalTo(true),
    }
  }

  return {
    tasks: tasksPath,
  }
}

export default connect(mapPropsToSubscriptions)(TaskList)
