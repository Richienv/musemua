"use client";

import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import Image from "next/image";
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import { usePathname, useRouter } from 'next/navigation';
import { Bell, MessageSquare, Search } from "lucide-react";

const NotificationsPopup = dynamic(() => import('@/components/notifications-popup').then(mod => mod.NotificationsPopup), { ssr: false });
const ProfileButton = dynamic(() => import('@/components/profile-button').then(mod => mod.ProfileButton), { ssr: false });

interface NavbarProps {
  onFilterChange?: (value: string) => void;
}

interface UserData {
  id: string;
  email: string;
  first_name: string;
  user_type: 'streamer' | 'client';
  profile_picture_url: string | null;
  streamer_id?: number;
  image_url?: string | null;
}

export function Navbar({ onFilterChange }: NavbarProps) {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [dashboardLink, setDashboardLink] = useState("/");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [userType, setUserType] = useState<'streamer' | 'client' | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        try {
          const { data: userBasicData, error: userError } = await supabase
            .from('users')
            .select(`
              id, 
              email, 
              first_name, 
              user_type, 
              profile_picture_url
            `)
            .eq('id', user.id)
            .single();

          if (userError) throw userError;

          if (userBasicData) {
            let finalUserData: UserData = {
              ...userBasicData
            };
            
            setUserType(userBasicData.user_type as 'streamer' | 'client');

            if (userBasicData.user_type === 'streamer') {
              setDashboardLink("/streamer-dashboard");
              
              const { data: streamerData, error: streamerError } = await supabase
                .from('streamers')
                .select(`
                  id,
                  image_url
                `)
                .eq('user_id', user.id)
                .single();
              
              if (streamerError) throw streamerError;

              if (streamerData) {
                finalUserData = {
                  ...finalUserData,
                  profile_picture_url: streamerData.image_url || userBasicData.profile_picture_url,
                  image_url: streamerData.image_url,
                  streamer_id: streamerData.id
                };
              }
            } else {
              setDashboardLink("/protected");
            }

            setUserData(finalUserData);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, []);

  const isStreamerDashboard = pathname === '/streamer-dashboard';

  return (
    <div className="relative bg-[#faf9f6] border-b border-black/5 w-full z-40">
      <nav className="w-full py-2 sm:py-4">
        <div className="max-w-[2000px] mx-auto px-3 sm:px-6 lg:px-20">
          <div className="flex items-center justify-between h-12 sm:h-16">
            <div className="flex items-center flex-shrink-0">
              <Link href={dashboardLink} className="flex items-center">
                <div className="p-0.5 sm:p-1">
                  <Image
                    src="/images/salda-logoB.png"
                    alt="Salda Logo"
                    width={200}
                    height={200}
                    className="w-auto h-10 sm:h-16 object-contain"
                    priority
                  />
                </div>
              </Link>
            </div>

            {!isStreamerDashboard && onFilterChange && (
              <div className="flex-1 max-w-3xl mx-2 sm:mx-8">
                <div className={`relative transition-all duration-200 ${
                  isSearchFocused ? 'transform scale-[1.02] shadow-lg' : ''
                }`}>
                  <Input
                    type="text"
                    placeholder="Cari Host"
                    className="w-full pl-4 sm:pl-8 pr-12 sm:pr-16 py-3 sm:py-4 text-sm sm:text-base rounded-full border border-gray-200 
                      shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.15)] 
                      focus:shadow-[0_6px_16px_-4px_rgba(0,0,0,0.2)] 
                      transition-all duration-200
                      focus:border-blue-500
                      bg-white"
                    onChange={(e) => onFilterChange(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                  />
                  <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 sm:p-3 rounded-full shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                      <Search className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 sm:gap-5">
              {userData && (
                <>
                  <button 
                    onClick={() => router.push('/messages')} 
                    className="relative hidden sm:flex shrink-0 items-center justify-center hover:opacity-70 transition-opacity"
                  >
                    <MessageSquare className="h-6 w-6 text-gray-700" strokeWidth={1.5} />
                  </button>
                  <div className="block scale-90 sm:scale-100">
                    <NotificationsPopup />
                  </div>
                  <div className="hidden sm:block h-10 w-px bg-gray-200 mx-3"></div>
                </>
              )}
              <div className="hidden sm:block">
                <ProfileButton user={userData} />
              </div>
              <div className="block sm:hidden">
                <ProfileButton 
                  user={userData} 
                  showNameOnMobile={false}
                  className="scale-90 sm:scale-100"
                />
              </div>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
