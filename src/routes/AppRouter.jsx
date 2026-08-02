import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell.jsx';

const DashboardPage = lazy(() => import('../pages/DashboardPage.jsx'));
const WeightPage = lazy(() => import('../pages/WeightPage.jsx'));
const MeasurementsPage = lazy(() => import('../pages/MeasurementsPage.jsx'));
const FoodLogPage = lazy(() => import('../pages/FoodLogPage.jsx'));
const WorkoutPage = lazy(() => import('../pages/WorkoutPage.jsx'));
const HabitsPage = lazy(() => import('../pages/HabitsPage.jsx'));
const PhotosPage = lazy(() => import('../pages/PhotosPage.jsx'));
const SettingsPage = lazy(() => import('../pages/SettingsPage.jsx'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    </div>
  );
}

function LazyPage({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

const basename =
  import.meta.env.BASE_URL !== '/'
    ? import.meta.env.BASE_URL.replace(/\/$/, '')
    : undefined;

const router = createBrowserRouter(
  [
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <LazyPage><DashboardPage /></LazyPage> },
      { path: 'weight', element: <LazyPage><WeightPage /></LazyPage> },
      { path: 'measurements', element: <LazyPage><MeasurementsPage /></LazyPage> },
      { path: 'food', element: <LazyPage><FoodLogPage /></LazyPage> },
      { path: 'workouts', element: <LazyPage><WorkoutPage /></LazyPage> },
      { path: 'habits', element: <LazyPage><HabitsPage /></LazyPage> },
      { path: 'photos', element: <LazyPage><PhotosPage /></LazyPage> },
      { path: 'settings', element: <LazyPage><SettingsPage /></LazyPage> },
    ],
  },
  ],
  { basename },
);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
