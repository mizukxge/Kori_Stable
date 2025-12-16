import { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { Button } from '../ui/Button';
import { AlertCircle, Loader } from 'lucide-react';

interface StripePaymentFormProps {
  amount: number;
  currency: string;
  clientSecret: string;
  paymentIntentId: string;
  invoiceNumber: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function StripePaymentForm({
  amount,
  currency,
  clientSecret,
  paymentIntentId,
  invoiceNumber,
  onSuccess,
  onError,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      onError('Stripe not initialized');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: 'Customer',
          },
        },
      });

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
        onError(stripeError.message || 'Payment failed');
      } else if (paymentIntent?.status === 'succeeded') {
        onSuccess();
      } else {
        setError('Payment processing failed');
        onError('Payment processing failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border rounded-lg p-4 bg-background">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#fa755a',
              },
            },
          }}
        />
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex gap-2">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="space-y-2">
        <div className="text-sm">
          <p className="text-muted-foreground">Amount</p>
          <p className="text-2xl font-bold">
            {(amount / 100).toFixed(2)} {currency.toUpperCase()}
          </p>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isProcessing || !stripe}
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay ${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Invoice: {invoiceNumber}
      </p>
    </form>
  );
}
