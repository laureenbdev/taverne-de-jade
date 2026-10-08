import React from 'react';
import { RouteObject } from 'react-router-dom';

import { HouseLine, ChartBar, CalendarBlank, Sparkle, Gear } from 'phosphor-react';

import Home from './pages/home/home.tsx';
import Wishes from './pages/wishes/wishes.tsx';
import Settings from './pages/settings/settings.tsx';

export interface NavItem {
  path: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  element?: React.ComponentType;
}

export const navConfig: NavItem[] = [
  {
    path: '/',
    labelKey: 'nav.home',
    icon: HouseLine,
    element: Home,
  },
  {
    path: '/advancement',
    labelKey: 'nav.advancement',
    icon: ChartBar,
  },
  {
    path: '/planner',
    labelKey: 'nav.planner',
    icon: CalendarBlank,
  },
  {
    path: '/wishes',
    labelKey: 'nav.wishes',
    icon: Sparkle,
    element: Wishes,
  },
  {
    path: '/settings',
    labelKey: 'nav.settings',
    icon: Gear,
    element: Settings,
  },
];

export const routes: RouteObject[] = navConfig
  .filter((item) => item.element)
  .map((item) => {
    const Component = item.element!;
    return {
      path: item.path,
      element: <Component />,
    };
  });
