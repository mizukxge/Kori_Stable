import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Label } from '../../components/ui/Label';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface GalleryMeta {
  name: string;
  description?: string;
  isPasswordProtected: boolean;
  expiresAt?: string;
  isActive: boolean;
  viewCount: number;
  client?: {
    name: string;
  };
}

export default function PublicGalleryPage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [galleryMeta, setGalleryMeta] = useState<GalleryMeta | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);

  // Load gallery metadata
  useEffect(() => {
    loadGalleryMeta();
  }, [token]);

  const loadGalleryMeta = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:3001/g/${token}/meta`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Gallery not found');
        } else {
          setError('Failed to load gallery');
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      setGalleryMeta(data.data);
      
      // Check if gallery is active
      if (!data.data.isActive) {
        setError('This gallery is no longer available');
        setLoading(false);
        return;
      }

      // Check if expired
      if (data.data.expiresAt && new Date(data.data.expiresAt) < new Date()) {
        setError('This gallery has expired');
        setLoading(false);
        return;
      }

      // Check if needs password
      if (data.data.isPasswordProtected) {
        setNeedsPassword(true);
      } else {
        setHasAccess(true);
      }

      console.log('✅ Gallery metadata loaded:', data.data.name);
    } catch (err) {
      console.error('❌ Failed to load gallery:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !password) return;

    setVerifying(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:3001/g/${token}/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'Incorrect password');
        setVerifying(false);
        return;
      }

      console.log('✅ Password verified');
      setHasAccess(true);
      setNeedsPassword(false);
    } catch (err) {
      console.error('❌ Password verification failed:', err);
      setError('Failed to verify password');
    } finally {
      setVerifying(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading gallery...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="text-destructive text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold mb-2">Gallery Unavailable</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Password entry
  if (needsPassword && !hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <Lock className="w-12 h-12 mx-auto text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-2">{galleryMeta?.name}</h2>
              <p className="text-muted-foreground">
                This gallery is password protected
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Enter password"
                    disabled={verifying}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={verifying || !password}
              >
                {verifying ? 'Verifying...' : 'Access Gallery'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Gallery content (has access)
  if (hasAccess && galleryMeta) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2">{galleryMeta.name}</h1>
            {galleryMeta.description && (
              <p className="text-lg text-muted-foreground">
                {galleryMeta.description}
              </p>
            )}
            {galleryMeta.client && (
              <p className="text-sm text-muted-foreground mt-2">
                by {galleryMeta.client.name}
              </p>
            )}
          </div>

          {/* Gallery content will go here */}
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                Gallery photos will be displayed here
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                (CG1 Step 2: Photo grid coming next!)
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}