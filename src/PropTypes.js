import { PropTypes } from 'react'

export const firebaseAppShape = PropTypes.shape({ // eslint-disable-line import/prefer-default-export
  database: PropTypes.func.isRequired,
})
