import PropTypes from 'prop-types'
import { Component, createElement } from 'react'
import invariant from 'invariant'
import firebase from 'firebase/app'
import 'firebase/database'
import {
  createQueryRef,
  getDisplayName,
  mapValues,
  mapSubscriptionsToQueries,
  mapQuerySnapshotToValue,
  pickBy,
  wrapActionProps,
} from './utils'

const defaultMergeProps = (ownProps, data) => ({ ...ownProps, ...data })
const defaultMapFirebaseToProps = (props, ref, firebaseApp) => ({ firebaseApp })

export default (mapFirebaseToProps = defaultMapFirebaseToProps, mergeProps = defaultMergeProps) => {
  const mapFirebase = typeof mapFirebaseToProps === 'function'
    ? mapFirebaseToProps
    : () => mapFirebaseToProps

  const computeSubscriptions = (props, ref, firebaseApp) => {
    const firebaseProps = mapFirebase(props, ref, firebaseApp)
    const subscriptions = pickBy(
      firebaseProps,
      prop => typeof prop === 'string' || (prop && prop.path),
    )

    invariant(
      typeof subscriptions === 'object',
      '`mapFirebaseToProps` must return an object. Instead received %s.',
      subscriptions,
    )

    return subscriptions
  }

  return WrappedComponent => {
    class FirebaseConnect extends Component {
      constructor(props, context) {
        super(props, context)

        this.firebaseApp = props.firebaseApp || context.firebaseApp || firebase.app()
        this.ref = path => this.firebaseApp.database().ref(path)
        this.state = {
          data: {},
          errors: {},
        }
      }

      componentDidMount() {
        const subscriptions = computeSubscriptions(this.props, this.ref, this.firebaseApp)

        this.mounted = true
        this.subscribe(subscriptions)
      }

      componentWillReceiveProps(nextProps) {
        const subscriptions = computeSubscriptions(this.props, this.ref, this.firebaseApp)
        const nextSubscriptions = computeSubscriptions(nextProps, this.ref, this.firebaseApp)
        const addedSubscriptions = pickBy(nextSubscriptions, (path, key) => !subscriptions[key])
        const removedSubscriptions = pickBy(subscriptions, (path, key) => !nextSubscriptions[key])
        const changedSubscriptions = pickBy(
          nextSubscriptions,
          (path, key) => subscriptions[key] && subscriptions[key] !== path,
        )

        this.unsubscribe({ ...removedSubscriptions, ...changedSubscriptions })
        this.subscribe({ ...addedSubscriptions, ...changedSubscriptions })
      }

      componentWillUnmount() {
        this.mounted = false

        if (this.listeners) {
          this.unsubscribe(this.listeners)
        }
      }

      onValue(key, query, snapshot) {
        if (!this.mounted) {
          return
        }

        this.setState(prevState => ({
          data: {
            ...prevState.data,
            [key]: mapQuerySnapshotToValue(query, snapshot),
          },
        }))
      }

      onError(key, error) {
        if (mergeProps.length < 3) {
          console.warn('Unhandled error')
        } else {
          this.setState(prevState => ({
            errors: {
              ...prevState.errors,
              [key]: error,
            },
          }))
        }
      }

      subscribe(subscriptions) {
        if (Object.keys(subscriptions).length < 1) {
          return
        }

        const queries = mapSubscriptionsToQueries(subscriptions)
        const nextListeners = mapValues(queries, ({ path, ...query }, key) => {
          const onValue = snapshot => this.onValue(key, query, snapshot)
          const onError = error => this.onError(key, error)
          const subscriptionRef = createQueryRef(this.ref(path), query)
          subscriptionRef.on('value', onValue, onError)

          return {
            path,
            unsubscribe: () => subscriptionRef.off('value', onValue),
          }
        })

        this.listeners = { ...this.listeners, ...nextListeners }
      }

      unsubscribe(subscriptions) {
        if (Object.keys(subscriptions).length < 1) {
          return
        }

        const nextListeners = { ...this.listeners }
        const nextData = { ...this.state.data }
        const nextErrors = { ...this.state.errors }

        Object.keys(subscriptions).forEach(key => {
          const subscription = this.listeners[key]
          subscription.unsubscribe()

          delete nextListeners[key]
          delete nextData[key]
          delete nextErrors[key]
        })

        this.listeners = nextListeners
        this.setState({ data: nextData, errors: nextErrors })
      }

      render() {
        const firebaseProps = mapFirebase(this.props, this.ref, this.firebaseApp)
        const actionProps = wrapActionProps(
          pickBy(firebaseProps, prop => typeof prop === 'function'),
          (key, error) => this.onError(key, error),
        )
        const props = mergeProps(
          this.props,
          { ...actionProps, ...this.state.data },
          this.state.errors,
        )

        return createElement(WrappedComponent, props)
      }
    }

    FirebaseConnect.WrappedComponent = WrappedComponent
    FirebaseConnect.defaultProps = Component.defaultProps
    FirebaseConnect.displayName = `FirebaseConnect(${getDisplayName(WrappedComponent)})`
    FirebaseConnect.contextTypes = FirebaseConnect.propTypes = {
      firebaseApp: PropTypes.shape({
        database: PropTypes.func.isRequired, // eslint-disable-line react/no-unused-prop-types
      }),
    }

    return FirebaseConnect
  }
}
