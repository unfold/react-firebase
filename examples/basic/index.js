import React from 'react';
import { render } from 'react-dom';
import Count from './Count';
import createDemoRef from '../createDemoRef';

const firebase = createDemoRef('basic');

const App = () => (
  <div>
    <Count firebase={firebase} />
  </div>
);

render(<App />, document.getElementById('example'));
