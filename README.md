React Firebase
==============

React bindings for [Firebase](https://firebase.google.com).

## Installation

React Firebase requires **React 0.14 and Firebase 3 or later.**

```
npm install --save react-firebase
```

## Usage

### `<Provider firebase>`

Makes a Firebase App reference available to the `connect()` calls in the component hierarchy below. Normally, you can’t use `connect()` without wrapping the root component in `<Provider>`.

If you *really* need to, you can manually pass `firebase` as a prop to every `connect()`ed component, but we only recommend to do this for stubbing `firebase` in unit tests, or in non-fully-React codebases. Normally, you should just use `<Provider>`.

#### Props

* `firebase` (*[App](https://firebase.google.com/docs/reference/js/firebase.app.App)*): A Firebase App reference.
* `children` (*ReactElement*) The root of your component hierarchy.

#### Example

##### Vanilla React

```js
import { initializeApp } from 'firebase'

const firebase = initializeApp({
  databaseURL: 'https://my-firebase.firebaseio.com'
})

ReactDOM.render(
  <Provider firebase={firebase}>
    <MyRootComponent />
  </Provider>,
  rootEl
)
```

### `connect([mapFirebaseToProps], [options])`

Connects a React component to a Firebase App reference.

It does not modify the component class passed to it.
Instead, it *returns* a new, connected component class, for you to use.

#### Arguments

* [`mapFirebaseToProps(props, ref, firebase): subscriptions`] \(*Object or Function*): If specified, the component will subscribe to Firebase `value` events. Its result, or the argument itself must be a plain object, and it will be merged into the component’s props. Each value must either a path to a location in the firebase, a query object or a function). If you omit it, the default implementation just injects `firebase` into your component’s props.

* [`options`] *(Object)* If specified, further customizes the behavior of the connector.
  * [`pure = true`] *(Boolean)*: If true, implements `shouldComponentUpdate` and shallowly compares the result of `mergeProps`, preventing unnecessary updates, assuming that the component is a “pure” component and does not rely on any input or state other than its props and subscriptions. *Defaults to `true`.*

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
  todos: 'todos'
  addTodo: todo => ref('todos').push(todo),
})

export default connect(mapFirebaseToProps)(TodoApp)
```

#####  Inject `todos`, `completedTodos`, a function that completes a todo (`completeTodo`) and one that logs in

```js
const mapFirebaseToProps = (ref, props, { auth }) => ({
  todos: 'todos',
  completedTodos: ref('todos').orderByChild('completed').equalTo(true),
  completeTodo = id => ref(`todos/${id}/completed`).set(true)
  login: (email, password) => auth().signInWithEmailAndPassword(email, password)
})

export default connect(mapFirebaseToProps)(TodoApp)
```

## License

MIT

## Acknowledgements

[`react-redux`](https://github.com/reactjs/react-redux) which this library is heavily inspired by.
