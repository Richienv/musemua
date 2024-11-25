"use client";

import { useEffect, useRef } from 'react';
import Script from 'next/script';

interface PaymentModalProps {
  token: string;
  onSuccess: (result: any) => void;
  onPending: (result: any) => void;
  onError: (result: any) => void;
  onClose: () => void;
}

declare global {
  interface Window {
    snap?: any;
  }
}

export function PaymentModal({
  token,
  onSuccess,
  onPending,
  onError,
  onClose
}: PaymentModalProps) {
  const snapInitialized = useRef(false);

  useEffect(() => {
    if (window.snap && token && !snapInitialized.current) {
      snapInitialized.current = true;
      window.snap.pay(token, {
        onSuccess: (result: any) => {
          snapInitialized.current = false;
          onSuccess(result);
        },
        onPending: (result: any) => {
          snapInitialized.current = false;
          onPending(result);
        },
        onError: (result: any) => {
          snapInitialized.current = false;
          onError(result);
        },
        onClose: () => {
          snapInitialized.current = false;
          onClose();
        }
      });
    }
  }, [token, onSuccess, onPending, onError, onClose]);

  return (
    <Script 
      src="https://app.sandbox.midtrans.com/snap/snap.js"
      data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
      strategy="afterInteractive"
    />
  );
} 