import { Component, PropTypes, createElement } from 'react'
import invariant from 'invariant'
import firebase from 'firebase/app'
import 'firebase/database'
import { createQueryRef, getDisplayName, mapValues, pickBy } from './utils'

const defaultMergeProps = (ownProps, firebaseProps) => ({
  ...ownProps,
  ...firebaseProps,
})

const mapSubscriptionsToQueries = subscriptions => (
  mapValues(subscriptions, value => (typeof value === 'string' ? { path: value } : value))
)

const defaultMapFirebaseToProps = (props, ref, firebaseApp) => ({ firebaseApp })

export default (mapFirebaseToProps = defaultMapFirebaseToProps, mergeProps = defaultMergeProps) => {
  const mapFirebase = (
    typeof mapFirebaseToProps === 'function' ? mapFirebaseToProps : () => mapFirebaseToProps
  )

  const computeSubscriptions = (props, ref, firebaseApp) => {
    const firebaseProps = mapFirebase(props, ref, firebaseApp)
    const subscriptions = pickBy(firebaseProps, prop => typeof prop === 'string' || (prop && prop.path))

    invariant(
      typeof subscriptions === 'object',
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
        const subscriptions = computeSubscriptions(this.props, this.ref, this.firebaseApp)

        this.mounted = true
        this.subscribe(subscriptions)
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
          this.unsubscribe(this.listeners)
        }
      }

      subscribe(subscriptions) {
        if (Object.keys(subscriptions).length < 1) {
          return
        }

        const queries = mapSubscriptionsToQueries(subscriptions)
        const nextListeners = mapValues(queries, ({ path, ...query }, key) => {
          const subscriptionRef = createQueryRef(this.ref(path), query)
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

          subscriptionRef.on('value', update)

          return {
            path,
            unsubscribe: () => subscriptionRef.off('value', update),
          }
        })

        this.listeners = { ...this.listeners, ...nextListeners }
      }

      unsubscribe(subscriptions) {
        if (Object.keys(subscriptions).length < 1) {
          return
        }

        const nextListeners = { ...this.listeners }
        const nextSubscriptionsState = { ...this.state.subscriptionsState }

        Object.keys(subscriptions).forEach(key => {
          const subscription = this.listeners[key]
          subscription.unsubscribe()

          delete nextListeners[key]
          delete nextSubscriptionsState[key]
        })

        this.listeners = nextListeners
        this.setState({ subscriptionsState: nextSubscriptionsState })
      }

      render() {
        const firebaseProps = mapFirebase(this.props, this.ref, this.firebaseApp)
        const actionProps = pickBy(firebaseProps, prop => typeof prop === 'function')
        const subscriptionProps = this.state.subscriptionsState
        const props = mergeProps(this.props, { ...actionProps, ...subscriptionProps })

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
