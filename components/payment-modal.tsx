"use client";

import { useEffect, useRef, useState } from 'react';

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load Midtrans script dynamically
    const loadScript = async () => {
      try {
        if (!window.snap && !document.getElementById('midtrans-script')) {
          const script = document.createElement('script');
          script.id = 'midtrans-script';
          script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
          script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '');
          
          // Wait for script to load
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        // Initialize payment once script is loaded
        if (token && !snapInitialized.current) {
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
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading Midtrans script:', error);
        setIsLoading(false);
      }
    };

    loadScript();

    return () => {
      const script = document.getElementById('midtrans-script');
      if (script) {
        document.head.removeChild(script);
      }
    };
  }, [token, onSuccess, onPending, onError, onClose]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
        <div className="bg-white p-4 rounded-lg">
          Loading payment...
        </div>
      </div>
    );
  }

  return null;
} 