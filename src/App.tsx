import '@/lib/sentry';
import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ActionsProvider } from '@/context/ActionsContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorBusProvider } from '@/components/ErrorBus';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import AdminPage from '@/pages/AdminPage';
import StammdatenPage from '@/pages/StammdatenPage';
import AngebotsanfragePage from '@/pages/AngebotsanfragePage';
import PublicFormStammdaten from '@/pages/public/PublicForm_Stammdaten';
import PublicFormAngebotsanfrage from '@/pages/public/PublicForm_Angebotsanfrage';
// <public:imports>
// </public:imports>
// <custom:imports>
// </custom:imports>

export default function App() {
  return (
    <ErrorBoundary>
      <ErrorBusProvider>
        <HashRouter>
          <ActionsProvider>
            <Routes>
              <Route path="public/69f07f61282730cf2b912ea7" element={<PublicFormStammdaten />} />
              <Route path="public/69f07f65d4576b77d41e08cc" element={<PublicFormAngebotsanfrage />} />
              {/* <public:routes> */}
              {/* </public:routes> */}
              <Route element={<Layout />}>
                <Route index element={<DashboardOverview />} />
                <Route path="stammdaten" element={<StammdatenPage />} />
                <Route path="angebotsanfrage" element={<AngebotsanfragePage />} />
                <Route path="admin" element={<AdminPage />} />
                {/* <custom:routes> */}
                {/* </custom:routes> */}
              </Route>
            </Routes>
          </ActionsProvider>
        </HashRouter>
      </ErrorBusProvider>
    </ErrorBoundary>
  );
}
