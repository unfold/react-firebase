import React from 'react'
import PropTypes from 'prop-types'
import firebase from 'firebase/app'
import Firebase from './Firebase'
import { getDisplayName } from './utils'

export default query => WrappedComponent => {
  const FirebaseConnect = props => (
    <Firebase
      firebaseApp={props.firebaseApp}
      query={typeof query === 'function' ? query(props) : query}
    >
      {(firebaseProps, firebaseRef, firebaseApp) => (
        <WrappedComponent
          {...firebaseProps}
          firebaseRef={firebaseRef}
          firebaseApp={firebaseApp}
          {...props}
        />
      )}
    </Firebase>
  )

  FirebaseConnect.WrappedComponent = WrappedComponent
  FirebaseConnect.displayName = `FirebaseConnect(${getDisplayName(WrappedComponent)})`
  FirebaseConnect.propTypes = {
    firebaseApp: PropTypes.instanceOf(firebase.app.App),
  }

  return FirebaseConnect
}
