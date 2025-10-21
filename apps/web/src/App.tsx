import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './components/providers/ThemeProvider';
import { Layout } from './components/layout/Layout';
import { PortalLayout } from './components/layout/PortalLayout';
import { DesignSystemDemo } from './pages/DesignSystemDemo';
import { PortalLogin } from './pages/portal/Login';
import { PortalDashboard } from './pages/portal/Dashboard';
import { PortalMessages } from './pages/portal/Messages';
import { PortalInvoices } from './pages/portal/Invoices';
import { PortalFiles } from './pages/portal/Files';
import { PortalDocuments } from './pages/portal/Documents';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="kori-theme">
      <BrowserRouter>
        <Routes>
          {/* Design System Demo */}
          <Route
            path="/design-system"
            element={
              <Layout>
                <DesignSystemDemo />
              </Layout>
            }
          />

          {/* Portal Login */}
          <Route path="/portal/login" element={<PortalLogin />} />

          {/* Portal Routes */}
          <Route
            path="/portal"
            element={
              <PortalLayout>
                <PortalDashboard />
              </PortalLayout>
            }
          />
          <Route
            path="/portal/messages"
            element={
              <PortalLayout>
                <PortalMessages />
              </PortalLayout>
            }
          />
          <Route
            path="/portal/invoices"
            element={
              <PortalLayout>
                <PortalInvoices />
              </PortalLayout>
            }
          />
          <Route
            path="/portal/files"
            element={
              <PortalLayout>
                <PortalFiles />
              </PortalLayout>
            }
          />
          <Route
            path="/portal/documents"
            element={
              <PortalLayout>
                <PortalDocuments />
              </PortalLayout>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/portal" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;