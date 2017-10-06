import React from 'react'
import PropTypes from 'prop-types'
import firebase from 'firebase/app'
import Firebase from './Firebase'
import { getDisplayName } from './utils'

export default WrappedComponent => {
  const WithFirebase = props => (
    <Firebase firebaseApp={props.firebaseApp}>
      {(firebaseProps, firebaseRef, firebaseApp) => (
        <WrappedComponent firebaseApp={firebaseApp} firebaseRef={firebaseRef} {...props} />
      )}
    </Firebase>
  )

  WithFirebase.WrappedComponent = WrappedComponent
  WithFirebase.displayName = `WithFirebase(${getDisplayName(WrappedComponent)})`
  WithFirebase.propTypes = {
    firebaseApp: PropTypes.instanceOf(firebase.app.App),
  }

  return WithFirebase
}
