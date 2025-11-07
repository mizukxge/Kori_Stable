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
import ClientsIndex from './routes/admin/clients/index';
import ClientDetailPage from './routes/admin/clients/[id]';
import InquiriesIndex from './routes/admin/inquiries/index';
import InquiryDetailPage from './routes/admin/inquiries/[id]';
import InquiryPage from './routes/inquiry';
import RightsPresetsPage from './routes/admin/rights/index';
import ContractsIndex from './routes/admin/contracts/index';
import ContractDetailPage from './routes/admin/contracts/[id]';
import ContractsDashboardPage from './routes/admin/contracts/dashboard';
import ClausesPage from './routes/admin/contracts/clauses';
import TemplatesPage from './routes/admin/contracts/templates';
import ContractViewer from './routes/contract/$token';
import SignContract from './routes/contract/sign/$token';
import ProposalsIndex from './routes/admin/proposals/index';
import ProposalDetailPage from './routes/admin/proposals/[id]';
import ProposalsDashboardPage from './routes/admin/proposals/dashboard';
import NewProposalPage from './routes/admin/proposals/new';
import EditProposalPage from './routes/admin/proposals/edit';
import { AdminProposalTemplates } from './routes/admin/proposal-templates/index';
import ProposalEmailTemplatesPage from './routes/admin/proposal-email-templates/index';
import InvoicesIndex from './routes/admin/invoices/index';
import InvoiceDetailPage from './routes/admin/invoices/[id]';
import NewInvoicePage from './routes/admin/invoices/new';
import ClientProposalPage from './routes/client/proposal/[proposalNumber]';
import ClientInvoicePage from './routes/client/invoice/[invoiceNumber]';
import ClientPaymentPage from './routes/payment/client-payment';
import NewClientPage from './routes/new-client';

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

          {/* Public Contract Routes - No auth required */}
          <Route path="/contract/:token" element={<ContractViewer />} />
          <Route path="/contract/sign/:token" element={<SignContract />} />

          {/* Client Proposal Routes - No auth required */}
          <Route path="/client/proposal/:proposalNumber" element={<ClientProposalPage />} />

          {/* Client Invoice Routes - No auth required */}
          <Route path="/client/invoice/:invoiceNumber" element={<ClientInvoicePage />} />

          {/* Client Payment Portal - No auth required */}
          <Route path="/payment/client" element={<ClientPaymentPage />} />

          {/* Public Inquiry Form - No auth required */}
          <Route path="/inquiry" element={<InquiryPage />} />

          {/* Client Signup Form - No auth required */}
          <Route path="/new-client" element={<NewClientPage />} />

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

          {/* Client Routes - LIST MUST COME BEFORE DETAIL */}
          <Route
            path="/admin/clients"
            element={
              <Layout>
                <ClientsIndex />
              </Layout>
            }
          />
          <Route
            path="/admin/clients/:id"
            element={
              <Layout>
                <ClientDetailPage />
              </Layout>
            }
          />

          {/* Inquiry Routes - LIST MUST COME BEFORE DETAIL */}
          <Route
            path="/admin/inquiries"
            element={
              <Layout>
                <InquiriesIndex />
              </Layout>
            }
          />
          <Route
            path="/admin/inquiries/:id"
            element={
              <Layout>
                <InquiryDetailPage />
              </Layout>
            }
          />

          {/* Rights Presets */}
          <Route
            path="/admin/rights"
            element={
              <Layout>
                <RightsPresetsPage />
              </Layout>
            }
          />

          {/* Contract Routes - LIST MUST COME BEFORE DETAIL */}
          <Route
            path="/admin/contracts/clauses"
            element={
              <Layout>
                <ClausesPage />
              </Layout>
            }
          />
          <Route
            path="/admin/contracts/templates"
            element={
              <Layout>
                <TemplatesPage />
              </Layout>
            }
          />
          <Route
            path="/admin/contracts/dashboard"
            element={
              <Layout>
                <ContractsDashboardPage />
              </Layout>
            }
          />
          <Route
            path="/admin/contracts"
            element={
              <Layout>
                <ContractsIndex />
              </Layout>
            }
          />
          <Route
            path="/admin/contracts/:id"
            element={
              <Layout>
                <ContractDetailPage />
              </Layout>
            }
          />

          {/* Proposal Template Routes */}
          <Route
            path="/admin/proposal-templates"
            element={
              <Layout>
                <AdminProposalTemplates />
              </Layout>
            }
          />

          {/* Proposal Email Template Routes */}
          <Route
            path="/admin/proposal-email-templates"
            element={
              <Layout>
                <ProposalEmailTemplatesPage />
              </Layout>
            }
          />

          {/* Proposal Routes - SPECIFIC ROUTES MUST COME BEFORE DYNAMIC ROUTES */}
          <Route
            path="/admin/proposals/dashboard"
            element={
              <Layout>
                <ProposalsDashboardPage />
              </Layout>
            }
          />
          <Route
            path="/admin/proposals/new"
            element={
              <Layout>
                <NewProposalPage />
              </Layout>
            }
          />
          <Route
            path="/admin/proposals/:id/edit"
            element={
              <Layout>
                <EditProposalPage />
              </Layout>
            }
          />
          <Route
            path="/admin/proposals"
            element={
              <Layout>
                <ProposalsIndex />
              </Layout>
            }
          />
          <Route
            path="/admin/proposals/:id"
            element={
              <Layout>
                <ProposalDetailPage />
              </Layout>
            }
          />

          {/* Invoice Routes - SPECIFIC ROUTES MUST COME BEFORE DYNAMIC ROUTES */}
          <Route
            path="/admin/invoices/new"
            element={
              <Layout>
                <NewInvoicePage />
              </Layout>
            }
          />
          <Route
            path="/admin/invoices"
            element={
              <Layout>
                <InvoicesIndex />
              </Layout>
            }
          />
          <Route
            path="/admin/invoices/:id"
            element={
              <Layout>
                <InvoiceDetailPage />
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