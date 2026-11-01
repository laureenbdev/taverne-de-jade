import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Header from './components/header/header.tsx';
import Banner from './components/banner/banner.tsx';
import Footer from './components/footer/footer.tsx';
import SideNav from './components/side-nav/side-nav.tsx';
import { AuthProvider } from './features/auth/AuthContext.tsx';
import { routes } from './routes.tsx';

function AppFrame() {
  const location = useLocation();
  const [navCollapsed, setNavCollapsed] = useState(false);

  return (
    <>
      <Banner />
      <Header />
      <div className="app-shell">
        <SideNav collapsed={navCollapsed} onToggle={() => setNavCollapsed((open) => !open)} />
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
        <AppFrame />
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
