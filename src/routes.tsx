import React from 'react';
import { RouteObject } from 'react-router-dom';

import { HouseLine, ChartBar, CalendarBlank, Sparkle, Gear, User } from 'phosphor-react';

import Home from './pages/home/home.tsx';
import Wishes from './pages/wishes/wishes.tsx';
import SupabaseTest from './pages/supabase-test/supabase-test.tsx';

// Configuration de navigation pour le Header
export interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  element?: React.ComponentType;
}

export const navConfig: NavItem[] = [
  {
    path: '/',
    label: 'Home',
    icon: HouseLine,
    element: Home,
  },
  {
    path: '/advancement',
    label: 'Advancement',
    icon: ChartBar,
  },
  {
    path: '/planner',
    label: 'Planner',
    icon: CalendarBlank,
  },
  {
    path: '/wishes',
    label: 'Wishes',
    icon: Sparkle,
    element: Wishes,
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: Gear,
  },
  {
    path: '/supabase',
    label: 'Supabase',
    icon: User,
    element: SupabaseTest,
  },
];

// Configuration des routes pour React Router
export const routes: RouteObject[] = navConfig
  .filter((item) => item.element) // Seulement les routes avec un composant
  .map((item) => {
    const Component = item.element!;
    return {
      path: item.path,
      element: <Component />,
    };
  });
