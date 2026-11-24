import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Header from './components/header/header.tsx';
import Banner from './components/banner/banner.tsx';
import Footer from './components/footer/footer.tsx';
import ImpersonationBanner from './components/impersonation-banner/impersonation-banner.tsx';
import SideNav from './components/side-nav/side-nav.tsx';
import { AuthProvider } from './features/auth/AuthContext.tsx';
// TODO(prelaunch): supprimer PrelaunchAuthGate (accès libre aux non-connectés)
import PrelaunchAuthGate from './features/auth/PrelaunchAuthGate.tsx';
import { routes } from './routes.tsx';

const MOBILE_NAV_MQ = '(max-width: 860px)';

function AppFrame() {
  const location = useLocation();
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isMobileNav, setIsMobileNav] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia(MOBILE_NAV_MQ).matches
  ));

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_NAV_MQ);
    const apply = () => {
      setIsMobileNav(mq.matches);
      if (!mq.matches) setMobileNavOpen(false);
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileNavOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileNavOpen]);

  return (
    <>
      <Banner />
      <Header
        mobileNavOpen={mobileNavOpen}
        onMobileNavToggle={() => setMobileNavOpen((open) => !open)}
      />
      <ImpersonationBanner />
      <div className={`app-shell${mobileNavOpen ? ' is-mobile-nav-open' : ''}`}>
        <SideNav
          collapsed={isMobileNav ? false : navCollapsed}
          mobile={isMobileNav}
          mobileOpen={mobileNavOpen}
          onToggle={() => setNavCollapsed((open) => !open)}
          onMobileClose={() => setMobileNavOpen(false)}
        />
        <div className="app-main">
          <div key={location.pathname} className="app-route">
            <Routes>
              {routes.map((route) => (
                <Route key={route.path} path={route.path} element={route.element} />
              ))}
            </Routes>
          </div>
          <Footer />
        </div>
      </div>
    </>
  );
}

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = (i18n.resolvedLanguage || 'en').slice(0, 2);
  }, [i18n.resolvedLanguage]);

  return (
    <AuthProvider>
      <HashRouter>
        {/* TODO(prelaunch): retirer PrelaunchAuthGate et laisser AppFrame seul */}
        <PrelaunchAuthGate>
          <AppFrame />
        </PrelaunchAuthGate>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
