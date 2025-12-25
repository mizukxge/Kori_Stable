import PublicGalleryPage from './routes/gallery/[token]';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './components/providers/ThemeProvider';
import { StripeProvider } from './components/providers/StripeProvider';
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
import ProposalTemplatesPage from './routes/admin/proposals/templates/index';
import InvoicesIndex from './routes/admin/invoices/index';
import InvoiceDetailPage from './routes/admin/invoices/[id]';
import NewInvoicePage from './routes/admin/invoices/new';
import ClientProposalPage from './routes/client/proposal/[proposalNumber]';
import ClientInvoicePage from './routes/client/invoice/[invoiceNumber]';
import ClientPaymentPage from './routes/payment/client-payment';
import InvoicePaymentPage from './routes/payment/invoice-payment';
import PaymentSuccessPage from './routes/payment/success';
import NewClientPage from './routes/new-client';
import EnvelopesIndex from './routes/admin/envelopes/index';
import EnvelopeDetailPage from './routes/admin/envelopes/[id]';
import CreateEnvelopePage from './routes/admin/envelopes/new';
import SigningPage from './routes/sign/[token]';
import LoginPage from './routes/login';
import AppointmentsIndex from './routes/admin/appointments/index';
import AppointmentDetailPage from './routes/admin/appointments/[id]';
import AppointmentsCalendarPage from './routes/admin/appointments/calendar';
import AppointmentsLinksPage from './routes/admin/appointments/links';
import AppointmentsSettingsPage from './routes/admin/appointments/settings';
import AppointmentsMetricsPage from './routes/admin/appointments/metrics';
import BookAppointmentPage from './routes/book/[token]';

// Force rebuild: 2025-12-17-rebuild-v4
function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="kori-theme">
      <StripeProvider>
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

          {/* Public Envelope Signing Route - No auth required */}
          <Route path="/sign/:token" element={<SigningPage />} />

          {/* Client Proposal Routes - No auth required */}
          <Route path="/client/proposal/:proposalNumber" element={<ClientProposalPage />} />

          {/* Client Invoice Routes - No auth required */}
          <Route path="/client/invoice/:invoiceNumber" element={<ClientInvoicePage />} />

          {/* Client Payment Portal - No auth required */}
          <Route path="/payment/client" element={<ClientPaymentPage />} />

          {/* Invoice Payment Portal (Stripe) - No auth required */}
          <Route path="/payment/invoice/:invoiceNumber" element={<InvoicePaymentPage />} />

          {/* Payment Success Page - No auth required */}
          <Route path="/payment/success" element={<PaymentSuccessPage />} />

          {/* Public Inquiry Form - No auth required */}
          <Route path="/inquiry" element={<InquiryPage />} />

          {/* Client Signup Form - No auth required */}
          <Route path="/new-client" element={<NewClientPage />} />

          {/* Admin Login - No layout */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Default Login Route - No layout */}
          <Route path="/login" element={<LoginPage />} />

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

          {/* Redirect old email templates URL */}
          <Route
            path="/admin/proposal-email-templates"
            element={<Navigate to="/admin/proposals/templates" replace />}
          />

          {/* Proposal Routes - SPECIFIC ROUTES MUST COME BEFORE DYNAMIC ROUTES */}

          {/* Proposal Templates Route */}
          <Route
            path="/admin/proposals/templates"
            element={
              <Layout>
                <ProposalTemplatesPage />
              </Layout>
            }
          />
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

          {/* Envelope Routes - SPECIFIC ROUTES MUST COME BEFORE DYNAMIC ROUTES */}
          <Route
            path="/admin/envelopes/new"
            element={
              <Layout>
                <CreateEnvelopePage />
              </Layout>
            }
          />
          <Route
            path="/admin/envelopes"
            element={
              <Layout>
                <EnvelopesIndex />
              </Layout>
            }
          />
          <Route
            path="/admin/envelopes/:id"
            element={
              <Layout>
                <EnvelopeDetailPage />
              </Layout>
            }
          />

          {/* Appointment Routes - SPECIFIC ROUTES MUST COME BEFORE DYNAMIC ROUTES */}
          <Route
            path="/admin/appointments/calendar"
            element={
              <Layout>
                <AppointmentsCalendarPage />
              </Layout>
            }
          />
          <Route
            path="/admin/appointments/links"
            element={
              <Layout>
                <AppointmentsLinksPage />
              </Layout>
            }
          />
          <Route
            path="/admin/appointments/settings"
            element={
              <Layout>
                <AppointmentsSettingsPage />
              </Layout>
            }
          />
          <Route
            path="/admin/appointments/metrics"
            element={
              <Layout>
                <AppointmentsMetricsPage />
              </Layout>
            }
          />
          <Route
            path="/admin/appointments/:id"
            element={
              <Layout>
                <AppointmentDetailPage />
              </Layout>
            }
          />
          <Route
            path="/admin/appointments"
            element={
              <Layout>
                <AppointmentsIndex />
              </Layout>
            }
          />

          {/* Public Appointment Booking - No auth required */}
          <Route
            path="/book/:token"
            element={<BookAppointmentPage />}
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
      </StripeProvider>
    </ThemeProvider>
  );
}

export default App;