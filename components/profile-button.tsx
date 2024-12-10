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
import { LayoutDashboard, Settings, LogOut } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  first_name: string;
  user_type: 'streamer' | 'client';
  profile_picture_url: string | null;
  image_url?: string | null;  // For streamer profile pictures
  streamer_id?: number;
}

interface ProfileButtonProps {
  user: UserData;
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
    return user?.user_type === 'streamer' ? '/streamer-dashboard' : '/protected';
  };

  const getSettingsLink = () => {
    return user?.user_type === 'streamer' ? '/settings?type=streamer' : '/settings';
  };

  // Get the correct profile picture URL based on user type
  const getProfilePictureUrl = () => {
    if (!user) return null;
    
    if (user.user_type === 'streamer') {
      // For streamers, prefer image_url if available, fallback to profile_picture_url
      return user.image_url || user.profile_picture_url;
    }
    // For other users, use profile_picture_url
    return user.profile_picture_url;
  };

  // Add console.log to debug
  const profilePictureUrl = getProfilePictureUrl();
  console.log('User Data:', user);
  console.log('Profile Picture URL:', profilePictureUrl);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          {profilePictureUrl ? (
            <Image
              src={profilePictureUrl}
              alt={`${user?.first_name}'s profile picture`}
              className="h-8 w-8 rounded-full object-cover"
              width={32}
              height={32}
              unoptimized
            />
          ) : (
            <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
              {user?.first_name?.charAt(0) || 'U'}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuItem onClick={() => router.push(getDashboardLink())} className="cursor-pointer">
          <LayoutDashboard className="mr-2 h-4 w-4" />
          <span>Dashboard</span>
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
