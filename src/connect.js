import { Component, createElement } from 'react'
import invariant from 'invariant'
import { isFunction, isPlainObject, isString, keys, pickBy, omitBy, reduce } from 'lodash'
import firebase from 'firebase/app'
import 'firebase/database'
import { firebaseAppShape } from './PropTypes'
import { applyMethods, getDisplayName } from './utils'

const mergeProps = (actionProps, subscriptionProps, ownProps) => ({
  ...ownProps,
  ...actionProps,
  ...subscriptionProps,
})

const mapSubscriptionsToQueries = subscriptions => (
  reduce(subscriptions, (queries, subscription, key) => ({
    ...queries,
    [key]: isString(subscription) ? { path: subscription } : subscription,
  }), {})
)

const defaultMapFirebaseToProps = (props, ref, firebaseApp) => ({ firebaseApp })

export default (mapFirebaseToProps = defaultMapFirebaseToProps) => {
  const mapFirebase = (
    isFunction(mapFirebaseToProps) ? mapFirebaseToProps : () => mapFirebaseToProps
  )

  const computeSubscriptions = (props, ref, firebaseApp) => {
    const firebaseProps = mapFirebase(props, ref, firebaseApp)
    const subscriptions = pickBy(firebaseProps, prop => isString(prop) || (prop && prop.path))

    invariant(
      isPlainObject(subscriptions),
      '`mapFirebaseToProps` must return an object. Instead received %s.',
      subscriptions
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
          subscriptionsState: null,
        }
      }

      componentDidMount() {
        this.mounted = true

        const subscriptions = computeSubscriptions(this.props, this.ref, this.firebaseApp)
        const shouldSubscribe = keys(subscriptions).length > 0

        if (shouldSubscribe) {
          this.subscribe(subscriptions)
        }
      }

      componentWillReceiveProps(nextProps) {
        const subscriptions = computeSubscriptions(this.props, this.ref, this.firebaseApp)
        const nextSubscriptions = computeSubscriptions(nextProps, this.ref, this.firebaseApp)
        const addedSubscriptions = pickBy(nextSubscriptions, (path, key) => !subscriptions[key])
        const removedSubscriptions = pickBy(subscriptions, (path, key) => !nextSubscriptions[key])
        const changedSubscriptions = pickBy(nextSubscriptions, (path, key) => (
          subscriptions[key] && subscriptions[key] !== path
        ))

        this.unsubscribe({ ...removedSubscriptions, ...changedSubscriptions })
        this.subscribe({ ...addedSubscriptions, ...changedSubscriptions })
      }

      componentWillUnmount() {
        this.mounted = false

        if (this.listeners) {
          this.unsubscribe()
        }
      }

      subscribe(subscriptions) {
        const queries = mapSubscriptionsToQueries(subscriptions)

        this.listeners = reduce(queries, (listeners, { path, ...query }, key) => {
          const subscriptionRef = applyMethods(this.ref(path), query)
          const update = snapshot => {
            if (this.mounted) {
              this.setState(prevState => ({
                subscriptionsState: {
                  ...prevState.subscriptionsState,
                  [key]: snapshot.val(),
                },
              }))
            }
          }

          const unsubscribe = () => subscriptionRef.off('value', update)

          subscriptionRef.on('value', update)

          return {
            ...listeners,
            [key]: {
              path,
              unsubscribe,
            },
          }
        }, this.listeners)
      }

      unsubscribe(subscriptions = this.listeners) {
        const subscriptionKeys = keys(subscriptions)

        this.listeners = reduce(subscriptionKeys, (listeners, key) => {
          const subscription = listeners[key]
          subscription.unsubscribe()

          return omitBy(listeners, key)
        }, this.listeners)

        this.setState(prevState => ({
          subscriptionsState: omitBy(prevState.subscriptionsState, subscriptionKeys),
        }))
      }

      render() {
        const firebaseProps = mapFirebase(this.props, this.ref, this.firebaseApp)
        const actionProps = pickBy(firebaseProps, isFunction)
        const subscriptionProps = this.state.subscriptionsState
        const props = mergeProps(actionProps, subscriptionProps, this.props)

        return createElement(WrappedComponent, props)
      }
    }

    FirebaseConnect.WrappedComponent = WrappedComponent
    FirebaseConnect.defaultProps = Component.defaultProps
    FirebaseConnect.displayName = `FirebaseConnect(${getDisplayName(WrappedComponent)})`
    FirebaseConnect.contextTypes = FirebaseConnect.propTypes = {
      firebaseApp: firebaseAppShape,
    }

    return FirebaseConnect
  }
}
