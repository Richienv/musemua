"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/app/actions";
import Image from "next/image";
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, Settings, LogOut, Clock } from 'lucide-react';

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

export function ProfileButton({ user, showNameOnMobile = true }: ProfileButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isStreamerDashboard = pathname === '/streamer-dashboard';

  const handleSignOut = async () => {
    await signOutAction();
    router.push('/sign-in');
  };

  const getDashboardLink = () => {
    return user?.user_type === 'streamer' ? '/streamer-dashboard' : '/client-bookings';
  };

  const getSettingsLink = () => {
    return user?.user_type === 'streamer' ? '/settings?type=streamer' : '/settings';
  };

  const getProfilePictureUrl = () => {
    if (!user) return null;
    
    // Add debugging
    console.log('Profile Button User Data:', {
      user,
      profilePictureUrl: user.profile_picture_url,
      userType: user.user_type
    });
    
    // For streamers, check both profile_picture_url and image_url
    if (user.user_type === 'streamer') {
      return user.profile_picture_url || user.image_url || null;
    }
    
    return user.profile_picture_url;
  };

  const profilePictureUrl = getProfilePictureUrl();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-8 w-8 rounded-full overflow-hidden p-0 border border-gray-200"
        >
          {profilePictureUrl ? (
            <>
              <Image
                src={profilePictureUrl}
                alt={`${user.first_name}'s profile picture`}
                className="h-8 w-8 rounded-full object-cover"
                width={32}
                height={32}
                priority
                style={{ transform: 'none' }}
                onError={(e) => {
                  console.error('Error loading profile image:', e);
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement?.querySelector('.fallback')?.classList.remove('hidden');
                }}
              />
              <span className="fallback hidden h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                {user.first_name.charAt(0) || 'U'}
              </span>
            </>
          ) : (
            <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
              {user.first_name.charAt(0) || 'U'}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuItem onClick={() => router.push(getDashboardLink())} className="cursor-pointer">
          {user.user_type === 'streamer' ? (
            <>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </>
          ) : (
            <>
              <Clock className="mr-2 h-4 w-4" />
              <span>My Bookings</span>
            </>
          )}
        </DropdownMenuItem>
        {/* Only show Settings option if not on streamer dashboard */}
        {!isStreamerDashboard && (
          <DropdownMenuItem onClick={() => router.push(getSettingsLink())} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}