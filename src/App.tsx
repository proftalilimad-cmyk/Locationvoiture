import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AbboudProvider } from './context/AbboudContext';
import { AbboudPublicSite } from './pages/AbboudPublicSite';

// Lazy-load the private 14-module admin dashboard & print engine so public visitors
// coming from Google never download the management back-office bundle.
const AbboudAdminDashboard = lazy(() =>
  import('./pages/AbboudAdminDashboard').then((m) => ({
    default: m.AbboudAdminDashboard,
  }))
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AbboudProvider>
        <Suspense
          fallback={
            <div className="min-h-screen bg-[#0B192C] text-white flex items-center justify-center text-sm font-semibold">
              Chargement Abboud Location…
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<AbboudPublicSite pageSlug="accueil" />} />
            <Route path="/vehicules" element={<AbboudPublicSite pageSlug="vehicules" />} />
            <Route path="/reservation" element={<AbboudPublicSite pageSlug="reservation" />} />
            <Route path="/agence" element={<AbboudPublicSite pageSlug="agence" />} />
            <Route path="/faq" element={<AbboudPublicSite pageSlug="faq" />} />
            <Route path="/contact" element={<AbboudPublicSite pageSlug="contact" />} />
            <Route
              path="/mentions-legales"
              element={<AbboudPublicSite pageSlug="mentions-legales" />}
            />
            <Route path="/admin" element={<AbboudAdminDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AbboudProvider>
    </BrowserRouter>
  );
};

export default App;
