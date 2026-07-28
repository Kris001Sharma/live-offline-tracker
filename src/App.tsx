import React from 'react';
import { AppCompositionRoot } from './app/composition-root';
import { AppRouter } from './app/routes';

export default function App() {
  return (
    <AppCompositionRoot>
      <AppRouter />
    </AppCompositionRoot>
  );
}
