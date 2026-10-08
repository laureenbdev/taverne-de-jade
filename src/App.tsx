import React, { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Header from './components/header/header.tsx';
import Banner from './components/banner/banner.tsx';
import Footer from './components/footer/footer.tsx';
import { AuthProvider } from './features/auth/AuthContext.tsx';
import { routes } from './routes.tsx';

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = (i18n.resolvedLanguage || 'en').slice(0, 2);
  }, [i18n.resolvedLanguage]);

  return (
    <AuthProvider>
      <HashRouter>
        <Banner />
        <Header />
        <Routes>
          {routes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Routes>
        <Footer />
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
