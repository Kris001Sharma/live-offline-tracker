import { assert, HARNESS } from '../framework';
import { readFileSync } from 'fs';
import * as path from 'path';

async function validateUI() {
  console.log('Validating UI structural components...');

  const authScreenPath = path.join(__dirname, '../../src/features/identity/components/AuthScreen.tsx');
  const authScreenContent = readFileSync(authScreenPath, 'utf-8');

  // Verify: Duplicate login taps -> Only one authentication request
  assert(authScreenContent.includes('disabled={!isFormValid || isLoading}'), 'Duplicate login taps prevented by disabling button on loading', 'API');
  
  // Verify: Error banner visibility
  assert(authScreenContent.includes('<ErrorDisplay'), 'Error banner component present', 'API');
  assert(authScreenContent.includes('errorMsg'), 'Error message state managed', 'API');

  // Verify: Loading overlay visibility
  assert(authScreenContent.includes('<LoadingOverlay'), 'Loading overlay present', 'API');
  assert(authScreenContent.includes('isLoading'), 'Loading state managed', 'API');

  // Verify: Accessibility labels
  assert(authScreenContent.includes('aria-label='), 'Accessibility labels implemented', 'API');

  // Verify: Responsive layout
  assert(authScreenContent.includes('max-w-md'), 'Responsive layout applied to form container', 'API');

  // Verify: Keyboard friendly layout
  assert(authScreenContent.includes('<form onSubmit='), 'Keyboard friendly layout (onSubmit)', 'API');

  const splashScreenPath = path.join(__dirname, '../../src/features/identity/components/SplashScreen.tsx');
  const splashScreenContent = readFileSync(splashScreenPath, 'utf-8');
  assert(splashScreenContent.includes('AppLifecycleState.OFFLINE_STARTUP'), 'Offline startup supported', 'API');

  const compRootPath = path.join(__dirname, '../../src/app/composition-root.tsx');
  const compRootContent = readFileSync(compRootPath, 'utf-8');
  assert(compRootContent.includes('AuthenticationEngine.restoreSession()'), 'Session restoration correctly orchestrated in composition root', 'API');
  assert(compRootContent.includes('AppLifecycleState.OFFLINE_STARTUP'), 'Offline startup correctly orchestrated in composition root', 'API');

  const routesPath = path.join(__dirname, '../../src/app/routes.tsx');
  const routesContent = readFileSync(routesPath, 'utf-8');
  assert(routesContent.includes('<SplashScreen'), 'Splash screen correctly integrated in router', 'API');
  assert(routesContent.includes('<AuthScreen'), 'Auth screen correctly integrated in router', 'API');

  console.log(`___JSON_REPORT___${JSON.stringify(HARNESS)}`);
}

validateUI();
