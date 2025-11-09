import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StripePaymentForm } from '../../components/payment/StripePaymentForm';
import { ArrowLeft, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { getInvoicePaymentDetails, createStripePaymentIntent } from '../../lib/payment-api';

export default function InvoicePaymentPage() {
  const { invoiceNumber } = useParams<{ invoiceNumber: string }>();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState<any>(null);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'ready' | 'processing' | 'success' | 'error'>('ready');

  useEffect(() => {
    loadInvoiceDetails();
  }, [invoiceNumber]);

  async function loadInvoiceDetails() {
    if (!invoiceNumber) {
      setError('Invoice number not provided');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const details = await getInvoicePaymentDetails(invoiceNumber);
      setInvoice(details);

      // Create payment intent
      const paymentIntent = await createStripePaymentIntent(details.id);
      setPaymentDetails(paymentIntent);
      setError(null);
    } catch (err) {
      console.error('Failed to load invoice:', err);
      setError(err instanceof Error ? err.message : 'Failed to load invoice details');
    } finally {
      setIsLoading(false);
    }
  }

  const handlePaymentSuccess = () => {
    setPaymentStatus('success');
    setTimeout(() => {
      navigate('/payment/success');
    }, 2000);
  };

  const handlePaymentError = (errorMsg: string) => {
    setPaymentStatus('error');
    setError(errorMsg);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="p-6 text-center">
            <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading invoice details...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-destructive">
          <div className="p-6">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
            <h2 className="text-center font-semibold text-destructive mb-2">Error</h2>
            <p className="text-center text-muted-foreground mb-6">{error}</p>
            <Button variant="outline" onClick={() => navigate(-1)} className="w-full">
              Go Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!invoice || !paymentDetails) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="p-6 text-center">
            <p className="text-muted-foreground">Invoice details not available</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Invoice Payment</h1>
        </div>

        {/* Success State */}
        {paymentStatus === 'success' && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <div className="p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-900 mb-2">Payment Successful!</h2>
              <p className="text-green-800 mb-4">
                Your payment has been processed. You will be redirected shortly.
              </p>
              <div className="text-sm text-green-700">
                <p>Invoice: <span className="font-medium">{invoice.invoiceNumber}</span></p>
                <p>Amount Paid: <span className="font-medium">{(paymentDetails.amount / 100).toFixed(2)} {paymentDetails.currency.toUpperCase()}</span></p>
              </div>
            </div>
          </Card>
        )}

        {/* Error State */}
        {paymentStatus === 'error' && error && (
          <Card className="mb-6 border-destructive">
            <div className="p-6">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-destructive text-center mb-2">Payment Failed</h2>
              <p className="text-muted-foreground text-center mb-4">{error}</p>
              <Button
                variant="outline"
                onClick={() => {
                  setPaymentStatus('ready');
                  setError(null);
                  loadInvoiceDetails();
                }}
                className="w-full"
              >
                Try Again
              </Button>
            </div>
          </Card>
        )}

        {/* Payment Form */}
        {paymentStatus === 'ready' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Invoice Summary */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Invoice Details</h2>

                <div className="space-y-4">
                  <div className="pb-4 border-b">
                    <p className="text-sm text-muted-foreground">Invoice Number</p>
                    <p className="font-medium">{invoice.invoiceNumber}</p>
                  </div>

                  <div className="pb-4 border-b">
                    <p className="text-sm text-muted-foreground">Bill To</p>
                    <p className="font-medium">{invoice.client.name}</p>
                    <p className="text-sm text-muted-foreground">{invoice.client.email}</p>
                  </div>

                  {invoice.items && invoice.items.length > 0 && (
                    <div className="pb-4 border-b">
                      <p className="text-sm text-muted-foreground mb-2">Items</p>
                      <ul className="space-y-2">
                        {invoice.items.map((item: any, idx: number) => (
                          <li key={idx} className="text-sm flex justify-between">
                            <span>{item.description}</span>
                            <span className="font-medium">
                              {(Number(item.total) / 100).toFixed(2)} {invoice.currency.toUpperCase()}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-muted-foreground">Total Due</p>
                    <p className="text-3xl font-bold">
                      {(paymentDetails.amount / 100).toFixed(2)} {paymentDetails.currency.toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Payment Form */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-6">Payment Details</h2>

                <StripePaymentForm
                  amount={paymentDetails.amount}
                  currency={paymentDetails.currency}
                  clientSecret={paymentDetails.clientSecret}
                  paymentIntentId={paymentDetails.paymentIntentId}
                  invoiceNumber={invoice.invoiceNumber}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
