import {
  LayoutDashboard,
  Scale,
  Ruler,
  Utensils,
  Dumbbell,
  CheckSquare,
  Camera,
  Settings,
  Sparkles,
  Target,
  History,
  CalendarDays,
  Trophy,
} from 'lucide-react';

/** Shared navigation groups. Existing routes stay reachable. */
export const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
    ],
  },
  {
    label: 'Nutrition',
    tone: 'nutrition',
    items: [
      { to: '/nutrition', icon: Utensils, label: 'Nutrition Dashboard' },
      { to: '/food', icon: Utensils, label: 'Food Diary' },
      { to: '/nutrition/goals', icon: Target, label: 'Macro Goals' },
      { to: '/weight', icon: Scale, label: 'Weight Tracking' },
      { to: '/nutrition/history', icon: History, label: 'Nutrition History' },
    ],
  },
  {
    label: 'Weight Training',
    tone: 'training',
    items: [
      { to: '/training', icon: Dumbbell, label: 'Training Dashboard' },
      { to: '/training/plan', icon: CalendarDays, label: 'Weekly Plan' },
      { to: '/workouts', icon: Dumbbell, label: 'Log Workout' },
      { to: '/training/history', icon: History, label: 'Exercise History' },
      { to: '/training/records', icon: Trophy, label: 'Personal Records' },
    ],
  },
  {
    label: 'Assistant',
    items: [
      { to: '/assistant', icon: Sparkles, label: 'AI Assistant' },
    ],
  },
  {
    label: 'Progress',
    items: [
      { to: '/measurements', icon: Ruler, label: 'Measurements' },
      { to: '/habits', icon: CheckSquare, label: 'Habits' },
      { to: '/photos', icon: Camera, label: 'Photos' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

export const MOBILE_NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Home', end: true },
  { to: '/nutrition', icon: Utensils, label: 'Nutrition' },
  { to: '/training', icon: Dumbbell, label: 'Train' },
  { to: '/assistant', icon: Sparkles, label: 'AI' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];
