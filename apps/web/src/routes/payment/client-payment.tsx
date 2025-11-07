import React, { useState, useEffect } from 'react';
import { getInvoicePaymentDetails, type InvoicePaymentDetails } from '../../lib/payment-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { AlertCircle, CheckCircle, Loader, CreditCard, Building2, Smartphone, DollarSign } from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  available: boolean;
}

export default function ClientPaymentPage() {
  const [invoice, setInvoice] = useState<InvoicePaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const invoiceNumber = new URLSearchParams(window.location.search).get('invoice') || '';

  useEffect(() => {
    const loadInvoice = async () => {
      try {
        setLoading(true);
        if (!invoiceNumber) {
          setError('Invoice number is required');
          return;
        }
        const data = await getInvoicePaymentDetails(invoiceNumber);
        setInvoice(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };

    loadInvoice();
  }, [invoiceNumber]);

  const cardPaymentMethods: PaymentMethod[] = [
    {
      id: 'stripe',
      name: 'Credit/Debit Card',
      icon: <CreditCard className="w-8 h-8" />,
      description: 'Pay with Visa, Mastercard, or other major cards',
      available: true,
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: <DollarSign className="w-8 h-8" />,
      description: 'Fast and secure PayPal payment',
      available: true,
    },
    {
      id: 'apple_pay',
      name: 'Apple Pay',
      icon: <Smartphone className="w-8 h-8" />,
      description: 'Quick payment with Apple Pay',
      available: true,
    },
    {
      id: 'google_pay',
      name: 'Google Pay',
      icon: <Smartphone className="w-8 h-8" />,
      description: 'Quick payment with Google Pay',
      available: true,
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      icon: <Building2 className="w-8 h-8" />,
      description: 'Direct bank transfer to our account',
      available: true,
    },
  ];

  const handlePaymentMethodSelect = async (methodId: string) => {
    setSelectedMethod(methodId);
    setProcessing(true);

    try {
      switch (methodId) {
        case 'stripe':
          window.location.href = `/payment/stripe?invoice=${invoiceNumber}`;
          break;
        case 'paypal':
          window.location.href = `/payment/paypal?invoice=${invoiceNumber}`;
          break;
        case 'apple_pay':
          window.location.href = `/payment/apple-pay?invoice=${invoiceNumber}`;
          break;
        case 'google_pay':
          window.location.href = `/payment/google-pay?invoice=${invoiceNumber}`;
          break;
        case 'bank_transfer':
          window.location.href = `/payment/bank-transfer?invoice=${invoiceNumber}`;
          break;
        default:
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process payment');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading invoice details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Error Loading Invoice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  const formattedAmount = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: invoice.currency,
  }).format(parseFloat(invoice.amountDue));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Payment Portal</h1>
          <p className="text-muted-foreground">Complete your payment securely</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{invoice.title}</CardTitle>
            <CardDescription>Invoice #{invoice.invoiceNumber}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Amount Due</p>
                <p className="text-2xl font-bold text-foreground">{formattedAmount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="text-lg font-semibold text-foreground">{invoice.client.name}</p>
              </div>
            </div>
            {invoice.amountPaid && parseFloat(invoice.amountPaid) > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-success">
                  Amount Paid: {new Intl.NumberFormat('en-GB', { style: 'currency', currency: invoice.currency }).format(parseFloat(invoice.amountPaid))}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {invoice.paymentType === 'CARD' && (
          <Card>
            <CardHeader>
              <CardTitle>Select Payment Method</CardTitle>
              <CardDescription>Choose how you would like to pay</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cardPaymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => handlePaymentMethodSelect(method.id)}
                    disabled={!method.available || processing}
                    className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                      selectedMethod === method.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-border hover:border-input'
                    } ${!method.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-muted-foreground mt-1">{method.icon}</div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{method.name}</p>
                        <p className="text-sm text-muted-foreground">{method.description}</p>
                      </div>
                      {selectedMethod === method.id && processing && (
                        <Loader className="w-5 h-5 animate-spin text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              {selectedMethod && (
                <Button
                  onClick={() => handlePaymentMethodSelect(selectedMethod)}
                  disabled={processing}
                  className="w-full mt-6"
                  size="lg"
                >
                  {processing ? 'Processing...' : 'Proceed to Payment'}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {invoice.paymentType === 'CASH' && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" />
                Cash Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground">
                This invoice has been configured for cash payment. Please arrange to pay the invoice amount in cash.
              </p>
              <div className="bg-card border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Total Amount Due</p>
                <p className="text-3xl font-bold text-foreground">{formattedAmount}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Contact us for cash payment details and arrangements.
              </p>
            </CardContent>
          </Card>
        )}

        {!invoice.paymentType && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="text-yellow-800 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Payment Method Not Configured
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-yellow-700">
                The payment method for this invoice has not been configured yet. Please contact us for payment details.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Need help? Contact us at support@example.com or call +44 123 456 7890</p>
        </div>
      </div>
    </div>
  );
}
