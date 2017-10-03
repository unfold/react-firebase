/* eslint-disable react/no-unused-prop-types, react/sort-comp */

import React from 'react'
import PropTypes from 'prop-types'
import Firebase from './Firebase'
import { getDisplayName } from './utils'

const defaultMapFirebaseToProps = (props, ref, firebaseApp) => ({
  firebaseApp,
})

export default (mapFirebaseToProps = defaultMapFirebaseToProps) => WrappedComponent => {
  const FirebaseConnect = props =>
    <Firebase
      firebaseApp={props.firebaseApp}
      query={mapFirebaseToProps}
      render={firebaseProps => <WrappedComponent {...firebaseProps} {...props} />}
    />

  FirebaseConnect.WrappedComponent = WrappedComponent
  FirebaseConnect.displayName = `FirebaseConnect(${getDisplayName(WrappedComponent)})`
  FirebaseConnect.propTypes = {
    firebaseApp: PropTypes.shape({
      database: PropTypes.func.isRequired,
    }),
  }

  return FirebaseConnect
}
