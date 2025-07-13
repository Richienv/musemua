"use client";

import { useEffect, useState } from 'react';
import Link from "next/link";
import { Mail, ArrowLeft, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { createClient } from '@/utils/supabase/client';

export default function EmailVerificationPage() {
  const [email, setEmail] = useState<string>('');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string>('');

  useEffect(() => {
    // Try to get the email from localStorage or URL params if available
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, []);

  const handleResendEmail = async () => {
    if (!email) return;
    
    setIsResending(true);
    setResendMessage('');
    
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        setResendMessage('Failed to resend email. Please try again.');
      } else {
        setResendMessage('Verification email sent successfully!');
      }
    } catch (error) {
      setResendMessage('Failed to resend email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full">
        {/* Back Link */}
        <div className="mb-8">
          <Link 
            href="/mua-sign-up"
            className="inline-flex items-center gap-2 text-vogue-silver hover:text-black transition-colors duration-300 editorial-caption"
          >
            <ArrowLeft className="w-4 h-4" />
            BACK TO SIGNUP
          </Link>
        </div>

        {/* Main Card */}
        <div className="text-center">
          {/* Icon */}
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto bg-vogue-cream rounded-full flex items-center justify-center">
              <Mail className="w-10 h-10 text-black" />
            </div>
          </div>

          {/* Headline */}
          <h1 className="editorial-headline text-black mb-6">
            Check Your Email
          </h1>

          {/* Description */}
          <div className="space-y-4 mb-12">
            <p className="editorial-body text-vogue-charcoal leading-relaxed">
              We've sent a verification link to your email address. Please click the link to activate your account and complete your registration.
            </p>
            
            {email && (
              <p className="editorial-caption text-vogue-silver">
                EMAIL SENT TO: <span className="text-black font-medium">{email}</span>
              </p>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-vogue-cream rounded-sm p-8 mb-8">
            <h3 className="editorial-subtitle text-black mb-4">
              What's Next?
            </h3>
            <div className="space-y-3 text-left">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-vogue-gold rounded-full mt-2 flex-shrink-0" />
                <p className="editorial-body text-vogue-charcoal">
                  Check your email inbox (and spam folder)
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-vogue-gold rounded-full mt-2 flex-shrink-0" />
                <p className="editorial-body text-vogue-charcoal">
                  Click the verification link in the email
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-vogue-gold rounded-full mt-2 flex-shrink-0" />
                <p className="editorial-body text-vogue-charcoal">
                  You'll be redirected to complete your profile
                </p>
              </div>
            </div>
          </div>

          {/* Resend Email */}
          <div className="space-y-4">
            <p className="editorial-caption text-vogue-silver">
              DIDN'T RECEIVE THE EMAIL?
            </p>
            
            <Button
              onClick={handleResendEmail}
              disabled={isResending || !email}
              variant="luxury-outline"
              className="w-full md:w-auto"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  SENDING...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  RESEND EMAIL
                </>
              )}
            </Button>

            {resendMessage && (
              <p className={`editorial-caption ${
                resendMessage.includes('successfully') 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {resendMessage}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-black/10">
            <p className="editorial-caption text-vogue-silver mb-4">
              NEED HELP?
            </p>
            <div className="flex justify-center gap-8">
              <Link 
                href="/support" 
                className="editorial-caption text-black hover:text-vogue-gold transition-colors duration-300"
              >
                CONTACT SUPPORT
              </Link>
              <Link 
                href="/sign-in" 
                className="editorial-caption text-black hover:text-vogue-gold transition-colors duration-300"
              >
                SIGN IN
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}