import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CheckCircle } from 'lucide-react';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-green-200 bg-green-50">
        <div className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-green-900 mb-2">Payment Successful!</h1>

          <p className="text-green-800 mb-4">
            Your payment has been processed successfully. Thank you for your business!
          </p>

          <p className="text-sm text-green-700 mb-6">
            You will be redirected to the home page in a few seconds...
          </p>

          <div className="space-y-3">
            <Button onClick={() => navigate('/')} className="w-full">
              Go to Home
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/portal/invoices')}
              className="w-full"
            >
              View Invoices
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
