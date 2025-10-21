import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { galleriesApi } from '../lib/api';
import { Lock, Eye, Download, Image as ImageIcon } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function PublicGallery() {
  const { token } = useParams();
  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);

  useEffect(() => {
    loadGallery();
  }, [token]);

  const loadGallery = async (pwd = '') => {
    try {
      setLoading(true);
      setError('');
      const response = await galleriesApi.getByToken(token, pwd);
      setGallery(response.data.data);
      setNeedsPassword(false);
    } catch (err) {
      if (err.response?.status === 401) {
        setNeedsPassword(true);
        setError('Password required');
      } else if (err.response?.status === 403) {
        setError('Invalid password');
      } else if (err.response?.status === 404) {
        setError('Gallery not found');
      } else {
        setError('Failed to load gallery');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    loadGallery(password);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (needsPassword || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <Lock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Protected Gallery</h1>
            <p className="text-gray-600 mt-2">This gallery requires a password</p>
          </div>

          {error && error !== 'Password required' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {needsPassword && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Unlock Gallery
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Gallery not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900">{gallery.name}</h1>
          {gallery.description && (
            <p className="text-gray-600 mt-2">{gallery.description}</p>
          )}
          <div className="flex items-center mt-4 text-sm text-gray-500">
            <Eye className="w-4 h-4 mr-2" />
            {gallery.viewCount} views
          </div>
        </div>
      </header>

      {/* Gallery grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gallery.assets?.map((asset) => (
            <div
              key={asset.id}
              className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                <div className="flex items-center justify-center">
                  <ImageIcon className="w-16 h-16 text-gray-400" />
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-600 truncate">{asset.asset.filename}</p>
                <button className="mt-2 flex items-center text-sm text-blue-600 hover:text-blue-700">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>

        {(!gallery.assets || gallery.assets.length === 0) && (
          <div className="text-center py-12">
            <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No photos in this gallery yet</p>
          </div>
        )}
      </div>
    </div>
  );
}