import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { clientsApi, adminInvoicesApi, adminGalleriesApi, adminRecordsApi } from '../lib/api';
import { Users, DollarSign, Image, FolderArchive, TrendingUp } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [clients, invoices, galleries, records] = await Promise.allSettled([
        clientsApi.stats(),
        adminInvoicesApi.list({ limit: 1 }),
        adminGalleriesApi.list({ limit: 1 }),
        adminRecordsApi.stats(),
      ]);

      setStats({
        clients: clients.status === 'fulfilled' ? clients.value.data : null,
        invoices: invoices.status === 'fulfilled' ? invoices.value.data : null,
        galleries: galleries.status === 'fulfilled' ? galleries.value.data : null,
        records: records.status === 'fulfilled' ? records.value.data : null,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const cards = [
    {
      name: 'Clients',
      value: stats?.clients?.total || 0,
      icon: Users,
      color: 'bg-blue-500',
      link: '/clients',
    },
    {
      name: 'Invoices',
      value: stats?.invoices?.length || 0,
      icon: DollarSign,
      color: 'bg-green-500',
      link: '/invoices',
    },
    {
      name: 'Galleries',
      value: stats?.galleries?.length || 0,
      icon: Image,
      color: 'bg-purple-500',
      link: '/galleries',
    },
    {
      name: 'Records',
      value: stats?.records?.total || 0,
      icon: FolderArchive,
      color: 'bg-orange-500',
      link: '/records',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's your overview.</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.name}
              to={card.link}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                </div>
                <div className={`${card.color} rounded-lg p-3`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/clients"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <Users className="w-5 h-5 text-blue-600 mr-3" />
            <span className="font-medium text-gray-900">Manage Clients</span>
          </Link>
          <Link
            to="/galleries"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <Image className="w-5 h-5 text-purple-600 mr-3" />
            <span className="font-medium text-gray-900">Create Gallery</span>
          </Link>
          <Link
            to="/invoices"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <DollarSign className="w-5 h-5 text-green-600 mr-3" />
            <span className="font-medium text-gray-900">Send Invoice</span>
          </Link>
        </div>
      </div>

      {/* Recent activity placeholder */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
        <div className="text-center py-12">
          <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Activity tracking coming soon...</p>
        </div>
      </div>
    </div>
  );
}