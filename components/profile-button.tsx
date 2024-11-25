"use client";

import React from 'react';
import Image from 'next/image';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import Link from 'next/link';
import { signOut } from "@/app/actions";
import { LogOut, User, Calendar, Settings, LayoutDashboard } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ExtendedUser {
  id: string;
  email?: string;
  first_name?: string;
  profile_picture_url?: string;
  user_type?: string;
}

interface ProfileButtonProps {
  user: ExtendedUser | null;
}

export function ProfileButton({ user }: ProfileButtonProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push('/sign-in');
  };

  if (!user) {
    return (
      <Link href="/sign-in" className="flex items-center space-x-2 text-xs text-gray-700 hover:text-gray-900">
        <User className="w-4 h-4" />
        <span>Sign In</span>
      </Link>
    );
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center space-x-2 focus:outline-none">
          {user.profile_picture_url ? (
            <Image
              src={user.profile_picture_url}
              alt={`${user.first_name}'s profile`}
              width={24}
              height={24}
              className="rounded-full"
            />
          ) : (
            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-gray-600 text-xs">{user.first_name?.[0] || user.email?.[0]}</span>
            </div>
          )}
          <span className="text-xs text-gray-700">{user.first_name || 'User'}</span>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content 
          className="min-w-[200px] bg-white rounded-md border border-gray-100 p-1.5 mt-2 z-[100]"
          sideOffset={5}
          align="end"
        >
          {user.user_type === 'client' && (
            <DropdownMenu.Item className="outline-none">
              <Link href="/client-bookings" 
                className="flex items-center space-x-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                <Calendar className="w-4 h-4" />
                <span>My Bookings</span>
              </Link>
            </DropdownMenu.Item>
          )}
          {user.user_type === 'streamer' && (
            <DropdownMenu.Item className="outline-none">
              <Link href="/streamer-dashboard" 
                className="flex items-center space-x-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Item className="outline-none">
            <Link href="/settings" 
              className="flex items-center space-x-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="h-px bg-gray-100 my-1" />
          <DropdownMenu.Item className="outline-none">
            <button 
              onClick={handleLogout} 
              className="flex items-center space-x-2 px-2 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-md transition-colors w-full"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
