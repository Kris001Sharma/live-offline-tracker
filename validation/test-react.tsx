import React from 'react';
import { renderToString } from 'react-dom/server';

const App = () => <div>Hello World</div>;
console.log(renderToString(<App />));
