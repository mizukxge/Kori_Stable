import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing OAuth callback...');

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const message = searchParams.get('message');

    if (error) {
      setStatus('error');
      setMessage(decodeURIComponent(error));
      // Redirect to settings after 3 seconds
      setTimeout(() => {
        navigate('/admin/appointments/settings?error=' + encodeURIComponent(error));
      }, 3000);
    } else if (success) {
      setStatus('success');
      setMessage(message ? decodeURIComponent(message) : 'OAuth connection successful!');
      // Redirect to settings after 2 seconds
      setTimeout(() => {
        navigate('/admin/appointments/settings?success=' + success + '&message=' + (message ? encodeURIComponent(message) : ''));
      }, 2000);
    } else {
      setStatus('error');
      setMessage('Invalid OAuth callback - missing parameters');
      setTimeout(() => {
        navigate('/admin/appointments/settings');
      }, 3000);
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="flex flex-col items-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
              <p className="text-center text-slate-600">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">Success!</h2>
              <p className="text-center text-slate-600 mb-4">{message}</p>
              <p className="text-sm text-slate-500 text-center">
                Redirecting to settings...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">Connection Failed</h2>
              <p className="text-center text-slate-600 mb-4">{message}</p>
              <p className="text-sm text-slate-500 text-center">
                Returning to settings...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
