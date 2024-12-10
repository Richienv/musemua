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
  image_url?: string | null;
  streamer_id?: number;
}

interface ProfileButtonProps {
  user: UserData | null;
  showNameOnMobile?: boolean;
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
        const { data: userBasicData } = await supabase
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

        if (userBasicData) {
          let finalUserData: UserData = {
            ...userBasicData,
            image_url: null,
            streamer_id: undefined
          };
          
          setUserType(userBasicData.user_type as 'streamer' | 'client');

          if (userBasicData.user_type === 'streamer') {
            setDashboardLink("/streamer-dashboard");
            const { data: streamerData } = await supabase
              .from('streamers')
              .select(`
                id,
                image_url,
                user_id
              `)
              .eq('user_id', user.id)
              .single();
            
            if (streamerData) {
              finalUserData = {
                ...finalUserData,
                image_url: streamerData.image_url,
                streamer_id: streamerData.id
              };
            }
          } else {
            setDashboardLink("/protected");
          }

          setUserData(finalUserData);
        }
      }
    };

    fetchUserData();
  }, []);

  const isStreamerDashboard = pathname === '/streamer-dashboard';

  const getSettingsUrl = (userType: string) => {
    return userType === 'streamer' ? '/settings?type=streamer' : '/settings';
  };

  return (
    <nav className="sticky top-0 z-50 bg-white text-black border-b border-black/5 w-full pt-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link href={dashboardLink} className="flex items-center">
              <div className="p-1.5">
                <Image
                  src="/images/salda-logoB.png"
                  alt="Salda Logo"
                  width={150}
                  height={150}
                  className="object-contain"
                />
              </div>
            </Link>
          </div>

          {!isStreamerDashboard && onFilterChange && (
            <div className="flex-1 max-w-xl mx-4 relative">
              <div className={`relative transition-all duration-200 ${
                isSearchFocused ? 'transform scale-105' : ''
              }`}>
                <Input
                  type="text"
                  placeholder="Cari Livestreamer kamu di Salda"
                  className="w-full pl-4 pr-12 py-2 rounded-lg border border-gray-200 
                    shadow-[0_2px_8px_-3px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_-3px_rgba(0,0,0,0.15)] 
                    focus:shadow-[0_6px_16px_-3px_rgba(0,0,0,0.2)] 
                    transition-all duration-200
                    focus:border-blue-500"
                  onChange={(e) => onFilterChange(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-1.5 rounded-md shadow-sm">
                    <Search className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-4">
            {userData && (
              <>
                <button 
                  onClick={() => router.push('/messages')} 
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <MessageSquare size={24} className="text-black" />
                </button>
                <NotificationsPopup />
                <div className="h-6 w-px bg-black opacity-10"></div>
              </>
            )}
            <div className="hidden sm:block">
              <ProfileButton user={userData} />
            </div>
            <div className="sm:hidden">
              <ProfileButton user={userData} showNameOnMobile={false} />
            </div>
            {!isStreamerDashboard && userData && (
              <Link
                href={getSettingsUrl(userData.user_type)}
                className="text-sm font-medium text-gray-700 hover:text-gray-800"
              >
                Settings
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
