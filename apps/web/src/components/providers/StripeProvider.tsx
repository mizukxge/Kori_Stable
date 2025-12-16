import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_live_51SZAetF7UhYV0H8FH0VBuoaHhxuFPsPbc71iIUYLpsdkCAgYDqaHjsYNKeFHhHpjBepC8AaAa9Ikzfsn1IsUZGF400rMs81C4R'
);

export function StripeProvider({ children }: { children: React.ReactNode }) {
  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
}
