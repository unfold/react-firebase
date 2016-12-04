import invariant from 'invariant'
import shallowCompare from 'react/lib/shallowCompare'
import { Component, createElement } from 'react'
import { isFunction, isPlainObject, isString, keys, pickBy, omitBy, reduce } from 'lodash'
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

const defaultMapFirebaseToProps = (props, ref, firebase) => ({ firebase })

export default (
  mapFirebaseToProps = defaultMapFirebaseToProps,
  options = {}
) => {
  const { pure = true } = options

  const mapFirebase = (
    isFunction(mapFirebaseToProps) ? mapFirebaseToProps : () => mapFirebaseToProps
  )

  const computeSubscriptions = (props, ref, firebase) => {
    const firebaseProps = mapFirebase(props, ref, firebase)
    const subscriptions = pickBy(firebaseProps, prop => isString(prop) || prop.path)

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

        const firebase = props.firebase || context.firebase

        invariant(firebase,
          'Could not find "firebase" in either the context or ' +
          `props of "${this.constructor.displayName}". ` +
          'Either wrap the root component in a <Provider>, ' +
          `or explicitly pass "firebase" as a prop to "${this.constructor.displayName}".`
        )

        this.firebase = firebase
        this.ref = path => firebase.database().ref(path)

        this.state = {
          subscriptionsState: null,
        }
      }

      componentDidMount() {
        this.mounted = true

        const subscriptions = computeSubscriptions(this.props, this.ref, this.firebase)
        const shouldSubscribe = keys(subscriptions).length > 0

        if (shouldSubscribe) {
          this.subscribe(subscriptions)
        }
      }

      componentWillReceiveProps(nextProps) {
        const subscriptions = computeSubscriptions(this.props, this.ref, this.firebase)
        const nextSubscriptions = computeSubscriptions(nextProps, this.ref, this.firebase)

        if (!pure || !shallowCompare(subscriptions, nextSubscriptions)) {
          const addedSubscriptions = pickBy(nextSubscriptions, (path, key) => !subscriptions[key])
          const removedSubscriptions = pickBy(subscriptions, (path, key) => !nextSubscriptions[key])
          const changedSubscriptions = pickBy(nextSubscriptions, (path, key) => (
            subscriptions[key] && subscriptions[key] !== path
          ))

          this.unsubscribe({ ...removedSubscriptions, ...changedSubscriptions })
          this.subscribe({ ...addedSubscriptions, ...changedSubscriptions })
        }
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
        const firebaseProps = mapFirebase(this.props, this.ref, this.firebase)
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
      firebase: firebaseAppShape,
    }

    return FirebaseConnect
  }
}
