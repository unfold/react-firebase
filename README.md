React Firebase
==============

React bindings for [Firebase](https://firebase.google.com).

## Installation

React Firebase requires **React 0.14 and Firebase 3 or later.**

```
npm install --save react-firebase
```

## Usage

### `connect([mapFirebaseToProps], [options])`

Connects a React component to a Firebase App reference.

It does not modify the component class passed to it. Instead, it *returns* a new, connected component class, for you to use.

#### Arguments

* [`mapFirebaseToProps(props, ref, firebaseApp): subscriptions`] \(*Object or Function*): Its result, or the argument itself must be a plain object. Each value must either be a path to a location in your database, a query object or a function. If you omit it, the default implementation just injects `firebaseApp` into your component’s props.

* [`options`] *(Object)* If specified, further customizes the behavior of the connector.
  * [`pure = true`] *(Boolean)*: If true, implements `shouldComponentUpdate`, preventing unnecessary updates, assuming that the component is a “pure” component and does not rely on any input or state other than its props and subscriptions. *Defaults to `true`.*

#### Returns

A React component class that injects subscriptions and actions into your component according to the specified options.

##### Static Properties

* `WrappedComponent` *(Component)*: The original component class passed to `connect()`.

#### Remarks

* It needs to be invoked two times. The first time with its arguments described above, and a second time, with the component: `connect(mapFirebaseToProps)(MyComponent)`.

* It does not modify the passed React component. It returns a new, connected component, that you should use instead.

#### Examples

> Runnable examples can be found in the [examples folder](examples/).

##### Inject `todos`

  > Note: The value of `todos` is analogous to https://my-firebase.firebaseio.com/todos.

```js
const mapFirebaseToProps = {
  todos: 'todos'
}

export default connect(mapFirebaseToProps)(TodoApp)
```

#####  Inject `todos` and a function that adds a new todo (`addTodo`)

```js
const mapFirebaseToProps = (props, ref) => ({
  todos: 'todos',
  addTodo: todo => ref('todos').push(todo)
})

export default connect(mapFirebaseToProps)(TodoApp)
```

#####  Inject `todos`, `completedTodos`, a function that completes a todo (`completeTodo`) and one that logs in

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
* `children` (*ReactElement*) The root of your component hierarchy.

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
