import React, { PropTypes } from 'react'
import { map } from 'lodash'
import { connect } from '../../src'
import { getSandboxedPath } from '../common'
import TaskSummary from './TaskSummary'

const complexPath = getSandboxedPath('complex')

const UserTaskSummary = ({ tasks }) => (
  <span>
    {map(tasks, (task, taskId) => (
      <TaskSummary key={taskId} taskId={taskId} />
    ))}
  </span>
)

UserTaskSummary.propTypes = {
  tasks: PropTypes.object,
}

const UserListItem = ({ user }) => (
  <li>{user.name} (<UserTaskSummary tasks={user.tasks} />)</li>
)

UserListItem.propTypes = {
  user: PropTypes.object,
}

const UserList = ({ users }) => (
  <div>
    <ul>
      {map(users, (user, userId) => <UserListItem key={userId} user={user} />)}
    </ul>
  </div>
)

UserList.propTypes = {
  users: PropTypes.object,
}

const mapFirebaseToProps = {
  users: `${complexPath}/users`,
}

export default connect(mapFirebaseToProps)(UserList)
