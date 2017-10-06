import React from 'react'
import firebase from 'firebase/app'
import PropTypes from 'prop-types'
import { createQueryRef, mapValues, mapSnapshotToValue, pickBy } from './utils'

const getSubscriptions = props => {
  if (typeof props.query === 'string') {
    return { [props.query]: { path: props.query } }
  }
  if (!props.query) {
    return {}
  }

  return mapValues(props.query, value => (typeof value === 'string' ? { path: value } : value))
}

export default class Firebase extends React.Component {
  static propTypes = {
    render: PropTypes.func,
    children: PropTypes.func,
    query: PropTypes.oneOfType([PropTypes.object, PropTypes.string, PropTypes.func]),
    firebaseApp: PropTypes.instanceOf(firebase.app.App), // eslint-disable-line react/no-unused-prop-types
  }

  static contextTypes = {
    firebaseApp: PropTypes.instanceOf(firebase.app.App),
  }

  state = {
    subscriptionsState: {},
    connected: false,
  }

  componentDidMount() {
    this.mounted = true
    this.subscribe(getSubscriptions(this.props))
  }

  componentWillReceiveProps(nextProps, nextContext) {
    const ref = this.getFirebaseRef(nextProps, nextContext)
    const subscriptions = getSubscriptions(this.props)
    const nextSubscriptions = getSubscriptions(nextProps)
    const addedSubscriptions = pickBy(nextSubscriptions, (path, key) => !subscriptions[key])
    const removedSubscriptions = pickBy(subscriptions, (path, key) => !nextSubscriptions[key])
    const changedSubscriptions = pickBy(
      nextSubscriptions,
      (subscription, key) => subscriptions[key] && subscriptions[key].path !== subscription.path,
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

  getFirebaseRef(props, context) {
    return path =>
      this.getFirebaseApp(props, context)
        .database()
        .ref(path)
  }

  getFirebaseApp(props = this.props, context = this.context) {
    return props.firebaseApp || context.firebaseApp || firebase.app()
  }

  getFirebaseProps() {
    if (typeof this.props.query === 'string') {
      return this.state.subscriptionsState[this.props.query]
    }

    return this.state.subscriptionsState
  }

  subscribe(subscriptions, ref = this.getFirebaseRef()) {
    if (Object.keys(subscriptions).length < 1) {
      return
    }

    const nextListeners = mapValues(subscriptions, ({ path, ...query }, key) => {
      const containsOrderBy = Object.keys(query).some(queryKey => queryKey.startsWith('orderBy'))
      const subscriptionRef = createQueryRef(ref(path), query)
      const update = snapshot => {
        if (this.mounted) {
          const value = containsOrderBy ? mapSnapshotToValue(snapshot) : snapshot.val()

          this.setState(prevState => ({
            connected: true,
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
    if (this.state.connected && this.props.render) {
      return this.props.render(
        this.getFirebaseProps(),
        this.getFirebaseRef(),
        this.getFirebaseApp(),
      )
    } else if (this.props.children) {
      return this.props.children(
        this.getFirebaseProps(),
        this.getFirebaseRef(),
        this.getFirebaseApp(),
      )
    }

    return null
  }
}
