import { assert, HARNESS } from '../framework';
import { readFileSync, existsSync } from 'fs';
import * as path from 'path';

async function validateUI() {
  console.log('Validating UI structural components...');

  // Auth Screen
  const authScreenPath = path.join(__dirname, '../../src/features/identity/components/AuthScreen.tsx');
  const authScreenContent = readFileSync(authScreenPath, 'utf-8');
  assert(authScreenContent.includes('disabled={!isFormValid || isLoading}'), 'Duplicate login taps prevented by disabling button on loading', 'API');
  assert(authScreenContent.includes('<ErrorDisplay'), 'Error banner component present', 'API');
  assert(authScreenContent.includes('errorMsg'), 'Error message state managed', 'API');
  assert(authScreenContent.includes('<LoadingOverlay'), 'Loading overlay present', 'API');
  assert(authScreenContent.includes('isLoading'), 'Loading state managed', 'API');
  assert(authScreenContent.includes('aria-label='), 'Accessibility labels implemented', 'API');
  assert(authScreenContent.includes('max-w-md'), 'Responsive layout applied to form container', 'API');
  assert(authScreenContent.includes('<form onSubmit='), 'Keyboard friendly layout (onSubmit)', 'API');

  // Composition & Routes
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

  // Slice 10C specific assertions
  // WorkerLayout
  const workerLayoutPath = path.join(__dirname, '../../src/components/layout/WorkerLayout.tsx');
  const workerLayoutContent = readFileSync(workerLayoutPath, 'utf-8');
  assert(workerLayoutContent.includes('<TopAppBar />'), 'TopAppBar integrated in WorkerLayout', 'ARCHITECTURE');
  assert(workerLayoutContent.includes('<BottomNavigation />'), 'BottomNavigation integrated in WorkerLayout', 'ARCHITECTURE');
  assert(workerLayoutContent.includes('<Outlet />'), 'Layout integrity: children passed via Outlet', 'ARCHITECTURE');
  assert(workerLayoutContent.includes('pb-safe'), 'Safe areas handled in WorkerLayout', 'API');
  
  // App Router wrapping
  assert(routesContent.includes('<GlobalFeedbackProvider>'), 'Single overlay/toast/dialog host via GlobalFeedbackProvider', 'ARCHITECTURE');
  assert(routesContent.includes('<WorkerLayout />'), 'Navigation routing wrapped in WorkerLayout', 'ARCHITECTURE');
  assert(routesContent.includes('<AuthenticatedOnly>'), 'Permission guard used for routes', 'ARCHITECTURE');
  
  // Guards
  const guardsPath = path.join(__dirname, '../../src/features/permissions/components/Guards.tsx');
  const guardsContent = readFileSync(guardsPath, 'utf-8');
  assert(guardsContent.includes('export function AuthenticatedOnly'), 'AuthenticatedOnly guard created', 'API');
  assert(guardsContent.includes('export function SupervisorOnly'), 'SupervisorOnly guard created', 'API');
  assert(guardsContent.includes('export function WorkerOnly'), 'WorkerOnly guard created', 'API');
  assert(guardsContent.includes('export function ConnectivityRequired'), 'ConnectivityRequired guard created', 'API');
  assert(guardsContent.includes('export function GPSRequired'), 'GPSRequired guard created', 'API');

  // TopAppBar
  const topAppBarPath = path.join(__dirname, '../../src/components/layout/TopAppBar.tsx');
  const topAppBarContent = readFileSync(topAppBarPath, 'utf-8');
  assert(topAppBarContent.includes('WorkerSyncEngine.status()'), 'TopAppBar observes sync state', 'API');
  assert(topAppBarContent.includes('ConnectivityEngine.status()'), 'TopAppBar observes connectivity state', 'API');
  assert(topAppBarContent.includes('AuthenticationEngine.logout()'), 'TopAppBar owns logout', 'ARCHITECTURE');

  // BottomNavigation
  const bottomNavPath = path.join(__dirname, '../../src/components/layout/BottomNavigation.tsx');
  const bottomNavContent = readFileSync(bottomNavPath, 'utf-8');
  assert(bottomNavContent.includes('isSupervisor'), 'BottomNavigation hides supervisor tab based on permission', 'ARCHITECTURE');
  
  // PageSkeleton
  const pageSkeletonPath = path.join(__dirname, '../../src/components/layout/PageSkeleton.tsx');
  const pageSkeletonContent = readFileSync(pageSkeletonPath, 'utf-8');
  assert(pageSkeletonContent.includes('primaryContent'), 'PageSkeleton implements primary content area', 'API');
  assert(pageSkeletonContent.includes('bottomActionArea'), 'PageSkeleton implements bottom action area', 'API');

  // Global Feedback Layer
  const globalFeedbackPath = path.join(__dirname, '../../src/components/feedback/GlobalFeedbackProvider.tsx');
  const globalFeedbackContent = readFileSync(globalFeedbackPath, 'utf-8');
  assert(globalFeedbackContent.includes('<LoadingOverlay'), 'GlobalFeedbackLayer includes LoadingOverlay', 'API');
  assert(globalFeedbackContent.includes('<ErrorDisplay'), 'GlobalFeedbackLayer includes ErrorDisplay', 'API');
  
  // Absence of duplicate Scaffold (if it exists, verify we prefer WorkerLayout)
  const scaffoldPath = path.join(__dirname, '../../src/components/layout/Scaffold.tsx');
  if (existsSync(scaffoldPath)) {
     // Ensure AppRouter uses WorkerLayout not Scaffold for the authenticated part
     assert(!routesContent.includes('<Scaffold>'), 'AppRouter migrated away from Scaffold', 'ARCHITECTURE');
  }

  console.log(`___JSON_REPORT___${JSON.stringify(HARNESS)}`);
}

validateUI();
