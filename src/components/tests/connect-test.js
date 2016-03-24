import 'jsdom-global/register';
import React from 'react';
import test from 'tape';
import { findDOMNode, unmountComponentAtNode } from 'react-dom';
import { renderIntoDocument } from 'react-addons-test-utils';

import connect from '../connect';

test('Should throw if no firebase instance was found in either props or context', assert => {
  assert.throws(() => {
    const WrappedComponent = connect()('div');

    renderIntoDocument(<WrappedComponent />);
  }, /Could not find "firebase"/);

  assert.end();
});

test('Should subscribe to a single path', assert => {
  const mockFirebase = {
    child: path => {
      assert.equal(path, 'foo');

      return mockFirebase;
    },
    on: (event, callback) => {
      assert.equal(event, 'value');

      const mockSnapshot = {
        val: () => 'foo changed',
      };

      callback(mockSnapshot);
    },
  };

  const mapPropsToSubscriptions = () => ({ foo: 'foo' });
  const WrappedComponent = connect(mapPropsToSubscriptions)('div');
  const container = renderIntoDocument(<WrappedComponent firebase={mockFirebase} />);

  assert.deepEqual(container.state.subscriptionsState, { foo: 'foo changed' });
  assert.end();
});

test('Should subscribe to a query', assert => {
  const mockFirebase = {
    child: () => {
      assert.fail();

      return mockFirebase;
    },
    startAt: priority => {
      assert.equal(priority, 1);

      return mockFirebase;
    },
    on: (event, callback) => {
      assert.equal(event, 'value');

      const mockSnapshot = {
        val: () => 'bar changed',
      };

      callback(mockSnapshot);
    },
  };

  const mapPropsToSubscriptions = () => ({ bar: firebase => firebase.startAt(1) });
  const WrappedComponent = connect(mapPropsToSubscriptions)('div');
  const container = renderIntoDocument(<WrappedComponent firebase={mockFirebase} />);

  assert.deepEqual(container.state.subscriptionsState, { bar: 'bar changed' });
  assert.end();
});

test('Should unsubscribe when component unmounts', assert => {
  const mockFirebase = {
    child: path => {
      assert.equal(path, 'baz');

      return mockFirebase;
    },
    on: (event, callback) => {
      assert.equal(event, 'value');

      const mockSnapshot = {
        val: () => 'baz changed',
      };

      callback(mockSnapshot);
    },
    off: event => {
      assert.equal(event, 'value');
    },
  };

  const mapPropsToSubscriptions = () => ({ baz: 'baz' });
  const WrappedComponent = connect(mapPropsToSubscriptions)('div');
  const container = renderIntoDocument(<WrappedComponent firebase={mockFirebase} />);

  assert.deepEqual(container.state.subscriptionsState, { baz: 'baz changed' });

  unmountComponentAtNode(findDOMNode(container).parentNode);

  assert.end();
});

test('Should subscribe to nested paths');
test('Should map firebase to props');
test('Should keep connection to Firebase alive when specified and ignore later updates');
test('Should update subscriptions when props change');
test('Should not re-render if options.pure is true');
test('Should re-render if options.pure is false');
test('Should merge using mergeProps function');
