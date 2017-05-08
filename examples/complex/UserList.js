import PropTypes from 'prop-types'
import React from 'react'
import { connect } from '../../src'
import { getSandboxedPath } from '../common'
import TaskSummary from './TaskSummary'

const complexPath = getSandboxedPath('complex')

const UserTaskSummary = ({ tasks = {} }) => (
  <span>
    {Object.keys(tasks).map(taskId => (
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

const UserList = ({ users = {} }) => (
  <div>
    <ul>
      {Object.keys(users).map(userId => <UserListItem key={userId} user={users[userId]} />)}
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
