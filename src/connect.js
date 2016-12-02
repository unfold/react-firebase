import invariant from 'invariant'
import shallowCompare from 'react/lib/shallowCompare'
import { Component, createElement } from 'react'
import { isEmpty, isFunction, isPlainObject, isString, keys, pickBy, omitBy, reduce } from 'lodash'
import { firebaseAppShape } from './PropTypes'
import { applyMethods, getDisplayName } from './utils'

const defaultMapFirebaseToProps = (props, ref, firebase) => ({ firebase })
const defaultMergeProps = (actionProps, subscriptionProps, parentProps) => ({
  ...parentProps,
  ...actionProps,
  ...subscriptionProps,
})

export default (
  mapFirebaseToProps = defaultMapFirebaseToProps,
  mergeProps = defaultMergeProps,
  options = {}
) => {
  const { pure = true } = options

  const mapSubscriptionsToQueries = subscriptions => (
    reduce(subscriptions, (queries, subscription, key) => ({
      ...queries,
      [key]: isString(subscription) ? { path: subscription } : subscription,
    }), {})
  )

  const computeSubscriptions = (props, ref, firebase) => {
    const firebaseProps = mapFirebaseToProps(props, ref, firebase)
    const subscriptions = pickBy(firebaseProps, prop => isString(prop) || prop.path)

    invariant(
      isPlainObject(subscriptions),
      '`mapFirebaseToProps` must return an object. Instead received %s.',
      subscriptions
    )

    return subscriptions
  }

  const computeMergedProps = (actionProps, subscriptionProps, parentProps) => {
    const mergedProps = mergeProps(actionProps, subscriptionProps, parentProps)

    invariant(
      isPlainObject(mergedProps),
      '`mergeProps` must return an object. Instead received %s.',
      mergedProps
    )

    return mergedProps
  }

  return WrappedComponent => {
    class FirebaseConnect extends Component {
      constructor(props, context) {
        super(props, context)

        this.firebase = props.firebase || context.firebase

        invariant(this.firebase,
          'Could not find "firebase" in either the context or ' +
          `props of "${this.constructor.displayName}". ` +
          'Either wrap the root component in a <Provider>, ' +
          `or explicitly pass "firebase" as a prop to "${this.constructor.displayName}".`
        )

        this.state = {
          subscriptionsState: null,
        }
      }

      componentDidMount() {
        this.mounted = true

        const subscriptions = computeSubscriptions(this.props, this.getRef, this.firebase)
        const shouldSubscribe = !isEmpty(subscriptions)

        if (shouldSubscribe) {
          this.subscribe(subscriptions)
        }
      }

      componentWillReceiveProps(nextProps) {
        const subscriptions = computeSubscriptions(this.props, this.getRef, this.firebase)
        const nextSubscriptions = computeSubscriptions(nextProps, this.getRef, this.firebase)

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

      getRef(path) {
        return this.firebase.database().ref(path)
      }

      subscribe(subscriptions) {
        const queries = mapSubscriptionsToQueries(subscriptions)

        this.listeners = reduce(queries, (listeners, { path, ...query }, key) => {
          const subscriptionRef = applyMethods(this.getRef(path), query)
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
        const firebaseProps = mapFirebaseToProps(this.props, this.getRef, this.firebase)
        const actionProps = pickBy(firebaseProps, isFunction)
        const subscriptionProps = this.state.subscriptionsState
        const props = computeMergedProps(actionProps, subscriptionProps, this.props)

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
