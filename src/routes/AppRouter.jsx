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
const NutritionDashboardPage = lazy(() => import('../pages/NutritionDashboardPage.jsx'));
const MacroGoalsPage = lazy(() => import('../pages/MacroGoalsPage.jsx'));
const NutritionHistoryPage = lazy(() => import('../pages/NutritionHistoryPage.jsx'));
const TrainingDashboardPage = lazy(() => import('../pages/TrainingDashboardPage.jsx'));
const WorkoutPlanPage = lazy(() => import('../pages/WorkoutPlanPage.jsx'));
const TrainingHistoryPage = lazy(() => import('../pages/TrainingHistoryPage.jsx'));
const PersonalRecordsPage = lazy(() => import('../pages/PersonalRecordsPage.jsx'));
const AssistantPage = lazy(() => import('../pages/AssistantPage.jsx'));

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
      { path: 'nutrition', element: <LazyPage><NutritionDashboardPage /></LazyPage> },
      { path: 'nutrition/goals', element: <LazyPage><MacroGoalsPage /></LazyPage> },
      { path: 'nutrition/history', element: <LazyPage><NutritionHistoryPage /></LazyPage> },
      { path: 'training', element: <LazyPage><TrainingDashboardPage /></LazyPage> },
      { path: 'training/plan', element: <LazyPage><WorkoutPlanPage /></LazyPage> },
      { path: 'training/history', element: <LazyPage><TrainingHistoryPage /></LazyPage> },
      { path: 'training/records', element: <LazyPage><PersonalRecordsPage /></LazyPage> },
      { path: 'assistant', element: <LazyPage><AssistantPage /></LazyPage> },
    ],
  },
  ],
  { basename },
);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
