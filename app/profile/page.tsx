"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const redirectToCorrectProfile = async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          router.push('/sign-in');
          return;
        }

        // Fetch user profile to determine user type
        const { data: userData, error: profileError } = await supabase
          .from('users')
          .select('user_type')
          .eq('id', user.id)
          .single();

        if (profileError || !userData) {
          console.error('Error fetching user type:', profileError);
          router.push('/protected');
          return;
        }

        // Redirect based on user type
        switch (userData.user_type) {
          case 'mua':
            router.push('/profile/mua/edit');
            break;
          case 'muse':
            router.push('/profile/muse/edit');
            break;
          case 'client':
            router.push('/settings'); // Clients use the existing settings page
            break;
          default:
            router.push('/protected');
        }
      } catch (error) {
        console.error('Error redirecting to profile:', error);
        router.push('/protected');
      } finally {
        setIsLoading(false);
      }
    };

    redirectToCorrectProfile();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-old-money-ivory flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-old-money-navy" />
          <p className="editorial-caption text-old-money-stone">LOADING PROFILE...</p>
        </div>
      </div>
    );
  }

  return null;
}