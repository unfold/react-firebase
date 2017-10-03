import React from 'react'
import firebase from 'firebase/app'
import PropTypes from 'prop-types'
import { createQueryRef, mapValues, mapSnapshotToValue, pickBy } from './utils'

const mapSubscriptionsToQueries = subscriptions =>
  mapValues(subscriptions, value => (typeof value === 'string' ? { path: value } : value))

const getQuery = (props, ref, app) => {
  switch (typeof props.query) {
    case 'string':
      return { [props.query]: props.query }
    case 'function':
      return props.query(ref, app)
    default:
      return props.query
  }
}

const getSubscriptions = (props, ref, app) =>
  pickBy(getQuery(props, ref, app), prop => typeof prop === 'string' || (prop && prop.path))

const getActions = (props, ref, app) =>
  pickBy(getQuery(props, ref, app), prop => typeof prop === 'function')

export default class Firebase extends React.Component {
  static propTypes = {
    render: PropTypes.func.isRequired,
    query: PropTypes.oneOfType([PropTypes.object, PropTypes.string, PropTypes.func]).isRequired,
    firebaseApp: PropTypes.shape({
      database: PropTypes.func.isRequired,
    }),
  }

  static contextTypes = {
    firebaseApp: PropTypes.shape({
      database: PropTypes.func.isRequired,
    }),
  }

  state = {
    subscriptionsState: {},
  }

  componentDidMount() {
    this.mounted = true
    const subscriptions = getSubscriptions(this.props, this.getRef(), this.getFirebaseApp())
    this.subscribe(subscriptions)
  }

  componentWillReceiveProps(nextProps, nextContext) {
    const app = this.getFirebaseApp(nextProps, nextContext)
    const ref = this.getRef(nextProps, nextContext)
    const subscriptions = getSubscriptions(this.props, ref, app)
    const nextSubscriptions = getSubscriptions(nextProps, ref, app)
    const addedSubscriptions = pickBy(nextSubscriptions, (path, key) => !subscriptions[key])
    const removedSubscriptions = pickBy(subscriptions, (path, key) => !nextSubscriptions[key])
    const changedSubscriptions = pickBy(
      nextSubscriptions,
      (path, key) => subscriptions[key] && subscriptions[key] !== path
    )

    this.unsubscribe({ ...removedSubscriptions, ...changedSubscriptions })
    this.subscribe({ ...addedSubscriptions, ...changedSubscriptions }, ref)
  }

  componentWillUnmount() {
    this.mounted = false

    if (this.listeners) {
      this.unsubscribe(this.listeners)
    }
  }

  getRef(props, context) {
    return path => this.getFirebaseApp(props, context).database().ref(path)
  }

  getFirebaseApp(props = this.props, context = this.context) {
    return props.firebaseApp || context.firebaseApp || firebase.app()
  }

  getFirebaseProps() {
    if (typeof this.props.query === 'string') {
      return this.state.subscriptionsState[this.props.query]
    }

    return {
      ...getActions(this.props, this.getRef(), this.getFirebaseApp()),
      ...this.state.subscriptionsState,
    }
  }

  subscribe(subscriptions, ref = this.getRef()) {
    if (Object.keys(subscriptions).length < 1) {
      return
    }

    const queries = mapSubscriptionsToQueries(subscriptions)
    const nextListeners = mapValues(queries, ({ path, ...query }, key) => {
      const containsOrderBy = Object.keys(query).some(queryKey => queryKey.startsWith('orderBy'))
      const subscriptionRef = createQueryRef(ref(path), query)
      const update = snapshot => {
        if (this.mounted) {
          const value = containsOrderBy ? mapSnapshotToValue(snapshot) : snapshot.val()

          this.setState(prevState => ({
            subscriptionsState: {
              ...prevState.subscriptionsState,
              [key]: value,
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
    return this.props.render(this.getFirebaseProps())
  }
}
