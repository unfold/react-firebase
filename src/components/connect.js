import invariant from 'invariant'
import shallowCompare from 'react/lib/shallowCompare'
import { Component, createElement } from 'react'
import { isFunction, isPlainObject, keys, pick, omit, reduce } from 'lodash'
import { firebaseAppShape } from '../utils/PropTypes'
import expandObject from '../utils/expandObject'
import flattenObject from '../utils/flattenObject'
import getDisplayName from '../utils/getDisplayName'

const defaultMapPropsToSubscriptions = props => ({}) // eslint-disable-line no-unused-vars
const defaultMapFirebaseToProps = (ref, props, firebase) => ({ firebase })
const defaultMergeProps = (subscriptionProps, firebaseProps, parentProps) => ({
  ...parentProps,
  ...subscriptionProps,
  ...firebaseProps,
})

export default (mapPropsToSubscriptions, mapFirebaseToProps, mergeProps, options = {}) => {
  const shouldSubscribe = Boolean(mapPropsToSubscriptions)
  const mapSubscriptions = mapPropsToSubscriptions || defaultMapPropsToSubscriptions
  const mapFirebase = mapFirebaseToProps || defaultMapFirebaseToProps
  const finalMergeProps = mergeProps || defaultMergeProps
  const { pure = true, keepalive = 0 } = options

  const computeSubscriptions = (props, firebase) => {
    const ref = path => firebase.database().ref(path)
    const subscriptions = mapSubscriptions(ref, props, firebase)

    invariant(
      isPlainObject(subscriptions),
      '`mapPropsToSubscriptions` must return an object. Instead received %s.',
      subscriptions
    )

    return flattenObject(subscriptions)
  }

  const computeMergedProps = (subscriptionProps, firebaseProps, parentProps) => {
    const mergedProps = finalMergeProps(subscriptionProps, firebaseProps, parentProps)

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

        if (shouldSubscribe) {
          this.subscribe(computeSubscriptions(this.props, this.firebase))
        }
      }

      componentWillReceiveProps(nextProps) {
        const subscriptions = computeSubscriptions(this.props, this.firebase)
        const nextSubscriptions = computeSubscriptions(nextProps, this.firebase)

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
        const getRef = path => this.firebase.database().ref(path)

        this.listeners = reduce(subscriptions, (listeners, path, key) => {
          const subscriptionRef = isFunction(path) ? path(getRef) : getRef(path)

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
        const firebase = this.firebase
        const ref = path => this.firebase.database().ref(path)
        const subscriptionProps = expandObject(this.state.subscriptionsState)
        const firebaseProps = mapFirebase(ref, this.props, firebase)
        const props = computeMergedProps(subscriptionProps, firebaseProps, this.props)

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
