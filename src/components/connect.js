import invariant from 'invariant'
import shallowCompare from 'react/lib/shallowCompare'
import { Component, createElement } from 'react'
import { isFunction, isPlainObject, keys, pick, omit, reduce } from 'lodash'
import { firebaseAppShape } from '../utils/PropTypes'
import expandObject from '../utils/expandObject'
import flattenObject from '../utils/flattenObject'
import getDisplayName from '../utils/getDisplayName'

const defaultMapPropsToSubscriptions = props => ({}) // eslint-disable-line no-unused-vars
const defaultMapFirebaseToProps = firebase => firebase
const defaultMergeProps = (subscriptionProps, actionProps, parentProps) => ({
  ...parentProps,
  ...subscriptionProps,
  ...actionProps,
})

export default (mapPropsToSubscriptions, mapFirebaseToProps, mergeProps, options = {}) => {
  const shouldSubscribe = Boolean(mapPropsToSubscriptions)
  const mapSubscriptions = mapPropsToSubscriptions || defaultMapPropsToSubscriptions
  const mapFirebase = mapFirebaseToProps || defaultMapFirebaseToProps
  const finalMergeProps = mergeProps || defaultMergeProps
  const { pure = true, keepalive = 0 } = options

  const computeSubscriptions = props => {
    const subscriptions = mapSubscriptions(props)

    invariant(
      isPlainObject(subscriptions),
      '`mapPropsToSubscriptions` must return an object. Instead received %s.',
      subscriptions
    )

    return flattenObject(subscriptions)
  }

  const computeMergedProps = (subscriptionProps, actionProps, parentProps) => {
    const mergedProps = finalMergeProps(subscriptionProps, actionProps, parentProps)

    invariant(
      isPlainObject(mergedProps),
      '`mergeProps` must return an object. Instead received %s.',
      mergedProps
    )

    return mergedProps
  }

  return WrappedComponent => {
    class FirebaseConnect extends Component {
      static defaultProps = Component.defaultProps

      constructor(props, context) {
        super(props)

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

        if (shouldSubscribe) {
          this.subscribe(computeSubscriptions(this.props))
        }
      }

      componentWillReceiveProps(nextProps) {
        const subscriptions = computeSubscriptions(this.props)
        const nextSubscriptions = computeSubscriptions(nextProps)

        if (!pure || !shallowCompare(subscriptions, nextSubscriptions)) {
          const addedSubscriptions = pick(nextSubscriptions, (path, key) => !subscriptions[key])
          const removedSubscriptions = pick(subscriptions, (path, key) => !nextSubscriptions[key])
          const changedSubscriptions = pick(nextSubscriptions, (path, key) => (
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
        const database = this.firebase.database()
        const ref = path => database.ref(path)

        this.listeners = reduce(subscriptions, (listeners, path, key) => {
          const subscriptionRef = isFunction(path) ? path(ref) : ref(path)

          invariant(
            subscriptionRef.on,
            '`path` must be a valid Firebase path. Instead received %s.',
            path,
            subscriptionRef
          )

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
          const unsubscribeKey = () => listeners[key].unsubscribe()

          if (keepalive) {
            setTimeout(unsubscribeKey, keepalive)
          } else {
            unsubscribeKey()
          }

          return omit(listeners, key)
        }, this.listeners)

        this.setState(prevState => ({
          subscriptionsState: omit(prevState.subscriptionsState, subscriptionKeys),
        }))
      }

      render() {
        const subscriptionProps = expandObject(this.state.subscriptionsState)
        const actionProps = mapFirebase(this.firebase, this.props)
        const props = computeMergedProps(subscriptionProps, actionProps, this.props)

        return createElement(WrappedComponent, props)
      }
    }

    FirebaseConnect.WrappedComponent = WrappedComponent
    FirebaseConnect.displayName = `FirebaseConnect(${getDisplayName(WrappedComponent)})`
    FirebaseConnect.contextTypes = FirebaseConnect.propTypes = {
      firebase: firebaseAppShape,
    }

    return FirebaseConnect
  }
}
