import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import PublicGallery from './pages/PublicGallery';
import PublicPayment from './pages/PublicPayment';

function Galleries() {
  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Galleries</h2>
      <p className="text-gray-600">Gallery management coming soon...</p>
    </div>
  );
}

function Proposals() {
  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Proposals</h2>
      <p className="text-gray-600">Proposal management coming soon...</p>
    </div>
  );
}

function Invoices() {
  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Invoices</h2>
      <p className="text-gray-600">Invoice management coming soon...</p>
    </div>
  );
}

function Contracts() {
  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Contracts</h2>
      <p className="text-gray-600">Contract management coming soon...</p>
    </div>
  );
}

function Records() {
  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Records</h2>
      <p className="text-gray-600">Records archive coming soon...</p>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">Page not found</p>
        <a href="/" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Go Home
        </a>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/g/:token" element={<PublicGallery />} />
          <Route path="/pay/:id" element={<PublicPayment />} />
          <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="clients" element={<Clients />} />
            <Route path="galleries" element={<Galleries />} />
            <Route path="proposals" element={<Proposals />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="contracts" element={<Contracts />} />
            <Route path="records" element={<Records />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;