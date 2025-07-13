"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { CheckCircle, ArrowRight, Sparkles, Heart } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { createClient } from '@/utils/supabase/client';

export default function VerificationSuccessPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          // If no user is found, redirect to sign in
          router.push('/sign-in');
          return;
        }

        setUser(user);
      } catch (error) {
        console.error('Error checking user:', error);
        router.push('/sign-in');
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, [router]);

  const handleContinue = () => {
    // Redirect to the main platform
    router.push('/protected');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="editorial-caption text-vogue-silver">VERIFYING...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full">
        {/* Main Card */}
        <div className="text-center">
          {/* Success Icon */}
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>

          {/* Headline */}
          <h1 className="editorial-headline text-black mb-6">
            Welcome to MUSE
          </h1>

          {/* Success Message */}
          <div className="space-y-4 mb-12">
            <p className="editorial-body text-vogue-charcoal leading-relaxed">
              Your email has been successfully verified! Your account is now active and ready to use.
            </p>
            
            {user && (
              <p className="editorial-caption text-vogue-silver">
                WELCOME, <span className="text-black font-medium">{user.user_metadata?.first_name || 'MEMBER'}</span>
              </p>
            )}
          </div>

          {/* Next Steps */}
          <div className="bg-gradient-to-br from-vogue-cream to-white rounded-sm p-8 mb-8 border border-black/5">
            <h3 className="editorial-subtitle text-black mb-6">
              Complete Your Journey
            </h3>
            <div className="space-y-4 text-left">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-vogue-gold rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-black font-bold text-sm">1</span>
                </div>
                <div>
                  <h4 className="editorial-caption text-black mb-1">EXPLORE TALENT</h4>
                  <p className="editorial-body text-vogue-charcoal text-sm">
                    Discover amazing MUAs and MUSE models in your area
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-vogue-gold rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-black font-bold text-sm">2</span>
                </div>
                <div>
                  <h4 className="editorial-caption text-black mb-1">COMPLETE PROFILE</h4>
                  <p className="editorial-body text-vogue-charcoal text-sm">
                    Add your portfolio details when you're ready
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-vogue-gold rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-black font-bold text-sm">3</span>
                </div>
                <div>
                  <h4 className="editorial-caption text-black mb-1">START COLLABORATING</h4>
                  <p className="editorial-body text-vogue-charcoal text-sm">
                    Connect with professionals and build your network
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            variant="luxury"
            size="luxury-lg"
            className="w-full md:w-auto mb-8"
          >
            <span>ENTER PLATFORM</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          {/* Footer */}
          <div className="pt-8 border-t border-black/10">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Heart className="w-4 h-4 text-vogue-gold" />
              <p className="editorial-caption text-vogue-silver">
                BUILT FOR CREATIVES
              </p>
              <Heart className="w-4 h-4 text-vogue-gold" />
            </div>
            
            <div className="flex justify-center gap-8">
              <Link 
                href="/about" 
                className="editorial-caption text-vogue-silver hover:text-black transition-colors duration-300"
              >
                ABOUT US
              </Link>
              <Link 
                href="/support" 
                className="editorial-caption text-vogue-silver hover:text-black transition-colors duration-300"
              >
                SUPPORT
              </Link>
              <Link 
                href="/terms" 
                className="editorial-caption text-vogue-silver hover:text-black transition-colors duration-300"
              >
                TERMS
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}