import React from 'react';
import { renderToString } from 'react-dom/server';
import { AuthScreen } from '../src/features/identity/components/AuthScreen';
import { MemoryRouter } from 'react-router-dom';
import { AppContext } from '../src/app/composition-root';

console.log(MemoryRouter);
