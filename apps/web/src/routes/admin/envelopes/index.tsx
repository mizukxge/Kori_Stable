/**
 * Envelope Dashboard
 * Admin view for managing all envelopes
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEnvelopes, getEnvelopeStats } from '../../../lib/envelopes-api';
import { StatusBadge } from '../../../components/envelope/StatusBadge';

interface Envelope {
  id: string;
  name: string;
  status: string;
  signingWorkflow: string;
  createdAt: string;
  sentAt?: string;
}

export default function EnvelopesPage() {
  const navigate = useNavigate();
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, [filter]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      // Load statistics
      const statsData = await getEnvelopeStats();
      setStats(statsData);

      // Load envelopes
      const filters = filter !== 'ALL' ? { status: filter } : undefined;
      const data = await getEnvelopes(filters);
      setEnvelopes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load envelopes');
    } finally {
      setLoading(false);
    }
  }

  const filteredEnvelopes = envelopes.filter(
    (env) =>
      env.name.toLowerCase().includes(search.toLowerCase()) ||
      env.id.toLowerCase().includes(search.toLowerCase())
  );

  const statusOptions = [
    { value: 'ALL', label: 'All Envelopes' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'EXPIRED', label: 'Expired' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Envelopes</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Manage multi-signature envelopes</p>
        </div>
        <button
          onClick={() => navigate('/admin/envelopes/new')}
          className="rounded-lg bg-blue-600 dark:bg-blue-700 px-6 py-2 font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-600"
        >
          + New Envelope
        </button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Envelopes</p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
            <p className="mt-2 text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.byStatus?.PENDING || 0}</p>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
            <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">{stats.byStatus?.COMPLETED || 0}</p>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Signers</p>
            <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalSigners}</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-4 text-red-800 dark:text-red-200">
          <p className="font-medium">Error loading envelopes</p>
          <p className="mt-1 text-sm">{error}</p>
          <button
            onClick={loadData}
            className="mt-3 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
          >
            Try again →
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      )}

      {/* Envelopes List */}
      {!loading && !error && (
        <div className="space-y-3">
          {filteredEnvelopes.length === 0 ? (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">No envelopes found</p>
              {filter === 'ALL' && search === '' && (
                <button
                  onClick={() => navigate('/admin/envelopes/new')}
                  className="mt-4 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  Create your first envelope →
                </button>
              )}
            </div>
          ) : (
            filteredEnvelopes.map((envelope) => (
              <button
                key={envelope.id}
                onClick={() => navigate(`/admin/envelopes/${envelope.id}`)}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-left hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{envelope.name}</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{envelope.id}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(envelope.createdAt).toLocaleDateString()}
                    </span>
                    <StatusBadge status={envelope.status as any} />
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <span className="text-xs inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                    {envelope.signingWorkflow === 'SEQUENTIAL' ? '📋 Sequential' : '🎯 Parallel'}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
