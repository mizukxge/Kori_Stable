import PublicGalleryPage from './routes/gallery/[token]';
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
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminClients } from './pages/admin/Clients';
import { AdminAssets } from './pages/admin/Assets';
import { AdminDocuments } from './pages/admin/Documents';
import { AdminSettings } from './pages/admin/Settings';
import GalleriesIndex from './routes/admin/galleries/index';
import GalleryAdminPage from './routes/admin/galleries/[id]';
import AdminLogin from './routes/admin/login';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="kori-theme">
      <BrowserRouter>
        <Routes>
          {/* Public Gallery Route - No auth required */}
          <Route
            path="/gallery/:token"
            element={<PublicGalleryPage />}
          />

          {/* Admin Login - No layout */}
          <Route path="/admin/login" element={<AdminLogin />} />

          
          {/* Admin Routes */}
          <Route
            path="/"
            element={
              <Layout>
                <AdminDashboard />
              </Layout>
            }
          />
          <Route
            path="/clients"
            element={
              <Layout>
                <AdminClients />
              </Layout>
            }
          />
          <Route
            path="/assets"
            element={
              <Layout>
                <AdminAssets />
              </Layout>
            }
          />
          <Route
            path="/documents"
            element={
              <Layout>
                <AdminDocuments />
              </Layout>
            }
          />
          <Route
            path="/settings"
            element={
              <Layout>
                <AdminSettings />
              </Layout>
            }
          />
          
          {/* Gallery Routes - LIST MUST COME BEFORE DETAIL */}
          <Route
            path="/admin/galleries"
            element={
              <Layout>
                <GalleriesIndex />
              </Layout>
            }
          />
          <Route
            path="/admin/galleries/:id"
            element={
              <Layout>
                <GalleryAdminPage />
              </Layout>
            }
          />

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
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;