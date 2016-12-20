import firebase from 'firebase'
import invariant from 'invariant'
import { Component, createElement } from 'react'
import { isFunction, isPlainObject, isString, keys, pickBy, omitBy, reduce } from 'lodash'
import { firebaseAppShape } from './PropTypes'
import { applyMethods, getDisplayName, getQueryKey } from './utils'

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

export default (
  mapFirebaseToProps = defaultMapFirebaseToProps,
  {
    cache = true,
    cacheMap,
  } = {},
) => {
  const valueCache = cacheMap || new Map()

  const mapFirebase = (
    isFunction(mapFirebaseToProps) ? mapFirebaseToProps : () => mapFirebaseToProps
  )

  const getSubscriptions = (props, ref, firebaseApp) => {
    const firebaseProps = mapFirebase(props, ref, firebaseApp)
    const subscriptions = pickBy(firebaseProps, prop => isString(prop) || (prop && prop.path))

    invariant(
      isPlainObject(subscriptions),
      '`mapFirebaseToProps` must return an object. Instead received %s.',
      subscriptions
    )

    return subscriptions
  }

  const getCachedSubscriptionsState = (props, ref, firebaseApp) => {
    if (!cache) {
      return null
    }

    const subscriptions = getSubscriptions(props, ref, firebaseApp)
    const queries = mapSubscriptionsToQueries(subscriptions)

    return reduce(queries, (state, { path, ...query }, key) => {
      const value = valueCache.get(getQueryKey(path, query))

      return {
        ...state,
        [key]: value,
      }
    }, {})
  }

  return WrappedComponent => {
    class FirebaseConnect extends Component {
      constructor(props, context) {
        super(props, context)

        this.firebaseApp = props.firebaseApp || context.firebaseApp || firebase.app()
        this.ref = path => this.firebaseApp.database().ref(path)
        this.state = {
          subscriptionsState: getCachedSubscriptionsState(props, this.ref, this.firebaseApp),
        }
      }

      componentDidMount() {
        this.mounted = true

        const subscriptions = getSubscriptions(this.props, this.ref, this.firebaseApp)
        const shouldSubscribe = keys(subscriptions).length > 0

        if (shouldSubscribe) {
          this.subscribe(subscriptions)
        }
      }

      componentWillReceiveProps(nextProps) {
        const subscriptions = getSubscriptions(this.props, this.ref, this.firebaseApp)
        const nextSubscriptions = getSubscriptions(nextProps, this.ref, this.firebaseApp)
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
              const value = snapshot.val()

              this.setState(prevState => ({
                subscriptionsState: {
                  ...prevState.subscriptionsState,
                  [key]: value,
                },
              }))

              if (cache) {
                valueCache.set(getQueryKey(path, query), value)
              }
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
