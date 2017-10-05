import React from 'react'
import PropTypes from 'prop-types'
import firebase from 'firebase/app'
import Firebase from './Firebase'
import { getDisplayName } from './utils'

export default WrappedComponent => {
  const FirebaseConnect = props => (
    <Firebase
      firebaseApp={props.firebaseApp}
      render={(firebaseProps, ref, firebaseApp) => (
        <WrappedComponent firebaseApp={firebaseApp} ref={ref} {...props} />
      )}
    />
  )

  FirebaseConnect.WrappedComponent = WrappedComponent
  FirebaseConnect.displayName = `FirebaseConnect(${getDisplayName(WrappedComponent)})`
  FirebaseConnect.propTypes = {
    firebaseApp: PropTypes.instanceOf(firebase.app.App),
  }

  return FirebaseConnect
}
