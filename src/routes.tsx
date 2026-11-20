import React from 'react';
import { RouteObject } from 'react-router-dom';

import {
  HouseLine,
  ChartBar,
  CalendarBlank,
  Sparkle,
  Gear,
  ShieldCheck,
  UsersThree,
  ChatCircleText,
} from 'phosphor-react';

import Advancement from './pages/advancement/advancement.tsx';
import AdminPage from './pages/admin/admin.tsx';
import AdminFeedbackPage from './pages/admin/admin-feedback.tsx';
import AdminUsersPage from './pages/admin/admin-users.tsx';
import Home from './pages/home/home.tsx';
import Planner from './pages/planner/planner.tsx';
import Wishes from './pages/wishes/wishes.tsx';
import Settings from './pages/settings/settings.tsx';

export interface NavItem {
  path: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  element?: React.ComponentType;
  adminOnly?: boolean;
  children?: NavItem[];
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
    element: Advancement,
  },
  {
    path: '/planner',
    labelKey: 'nav.planner',
    icon: CalendarBlank,
    element: Planner,
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
  {
    path: '/admin',
    labelKey: 'nav.admin',
    icon: ShieldCheck,
    adminOnly: true,
    element: AdminPage,
    children: [
      {
        path: '/admin/users',
        labelKey: 'nav.adminUsers',
        icon: UsersThree,
        element: AdminUsersPage,
        adminOnly: true,
      },
      {
        path: '/admin/feedback',
        labelKey: 'nav.adminFeedback',
        icon: ChatCircleText,
        element: AdminFeedbackPage,
        adminOnly: true,
      },
    ],
  },
];

function flattenRoutes(items: NavItem[]): RouteObject[] {
  const routes: RouteObject[] = [];
  for (const item of items) {
    if (item.element) {
      routes.push({
        path: item.path,
        element: React.createElement(item.element),
      });
    }
    if (item.children?.length) {
      routes.push(...flattenRoutes(item.children));
    }
  }
  return routes;
}

export const routes: RouteObject[] = flattenRoutes(navConfig);
