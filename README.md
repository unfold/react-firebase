React Firebase
==============

React bindings for [Firebase](https://firebase.google.com).

## Quick Start

```
import firebase from 'firebase'
import { connect } from 'react-firebase'

firebase.initializeApp({
  databaseURL: 'https://react-firebase-sandbox.firebaseio.com'
})

const Counter = ({ value, setValue }) => (
  <div>
    <button onClick={() => setCount(value - 1)}>-</button>
    <span>{value}</span>
    <button onClick={() => setCount(value + 1)}>+</button>
  </div>
)

export default connect((props, ref) => ({
  value: 'counterValue',
  setValue: value => ref('counterValue').set(value)
}))(TodosApp)
```

## Installation

```
npm install --save react-firebase
```

React Firebase requires **[React 0.14](https://github.com/facebook/react) and [Firebase 3](https://www.npmjs.com/package/firebase) or later.**

## Usage

### `connect([mapFirebaseToProps])`

Connects a React component to a Firebase App reference.

It does not modify the component class passed to it. Instead, it *returns* a new, connected component class, for you to use.

#### Arguments

* [`mapFirebaseToProps(props, ref, firebaseApp): subscriptions`] \(*Object or Function*): Its result, or the argument itself must be a plain object. Each value must either be a path to a location in your database, a query object or a function. If you omit it, the default implementation just passes `firebaseApp` as a prop to your component.

#### Returns

A React component class that passes subscriptions and actions as props to your component according to the specified options.

##### Static Properties

* `WrappedComponent` *(Component)*: The original component class passed to `connect()`.

#### Examples

> Runnable examples can be found in the [examples folder](examples/).

##### Pass `todos` as a prop

  > Note: The value of `todos` is the path to your data in Firebase. This is equivalent to `firebase.database().ref('todo')`.

```js
const mapFirebaseToProps = {
  todos: 'todos'
}

export default connect(mapFirebaseToProps)(TodoApp)
```

#####  Pass `todos` and a function that adds a new todo (`addTodo`) as props

```js
const mapFirebaseToProps = (props, ref) => ({
  todos: 'todos',
  addTodo: todo => ref('todos').push(todo)
})

export default connect(mapFirebaseToProps)(TodoApp)
```

#####  Pass `todos`, `completedTodos`, a function that completes a todo (`completeTodo`) and one that logs in as props

```js
const mapFirebaseToProps = (props, ref, { auth }) => ({
  todos: 'todos',
  completedTodos: {
    path: 'todos',
    orderByChild: 'completed',
    equalTo: true
  },
  completeTodo = id => ref(`todos/${id}/completed`).set(true),
  login: (email, password) => auth().signInWithEmailAndPassword(email, password)
})

export default connect(mapFirebaseToProps)(TodoApp)
```

### `<Provider firebaseApp>`

By default `connect()` will use the [default Firebase App](https://firebase.google.com/docs/reference/js/firebase.app). If you have multiple Firebase App references in your application you may use this to specify the Firebase App reference available to `connect()` calls in the component hierarchy below.

If you *really* need to, you can manually pass `firebaseApp` as a prop to every `connect()`ed component, but we only recommend to do this for stubbing `firebaseApp` in unit tests, or in non-fully-React codebases. Normally, you should just use `<Provider>`.

#### Props

* `firebaseApp` (*[App](https://firebase.google.com/docs/reference/js/firebase.app.App)*): A Firebase App reference.
* `children` (*ReactElement*): The root of your component hierarchy.

#### Example

```js
import { initializeApp } from 'firebase'

const firebaseApp = initializeApp({
  databaseURL: 'https://my-firebase.firebaseio.com'
})

ReactDOM.render(
  <Provider firebaseApp={firebaseApp}>
    <MyRootComponent />
  </Provider>,
  rootEl
)
```

## License

MIT

## Acknowledgements

[`react-redux`](https://github.com/reactjs/react-redux) which this library is heavily inspired by.
