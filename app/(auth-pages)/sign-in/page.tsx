"use client";

import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";

export default function Login({ searchParams }: { searchParams: Message }) {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningInAsMua, setIsSigningInAsMua] = useState(false);
  const [showMuaLogin, setShowMuaLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async (formData: FormData) => {
    setIsSigningIn(true);
    await signInAction(formData);
    setIsSigningIn(false);
  };

  const handleSignInAsMua = async (formData: FormData) => {
    setIsSigningInAsMua(true);
    await signInAction(formData); // Use same action, differentiate by user type in backend
    setIsSigningInAsMua(false);
  };

  return (
    <div className="relative w-full max-w-[420px]">

      {!showMuaLogin ? (
        // Client/MUSE Login Form
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Welcome to MUSE
              </h1>
              <p className="mt-2 text-gray-600">
                New to MUSE?{" "}
                <Link href="/muse-sign-up" className="text-rose-600 hover:text-rose-700 font-medium transition-colors">
                  Join as MUSE
                </Link>
              </p>
            </div>

            <form className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                <div className="relative">
                  <Input 
                    name="email" 
                    placeholder="name@example.com" 
                    required 
                    className="h-11 pl-4 bg-gray-50/50 border-gray-200 focus:bg-white text-base rounded-xl
                      focus:ring-2 focus:ring-rose-100 focus:border-rose-500 transition-all duration-200"
                    style={{ fontSize: '16px' }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    required
                    className="h-11 pl-4 pr-11 bg-gray-50/50 border-gray-200 focus:bg-white text-base rounded-xl
                      focus:ring-2 focus:ring-rose-100 focus:border-rose-500 transition-all duration-200"
                    style={{ fontSize: '16px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-6 pt-2">
                <Button 
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget.closest('form');
                    if (form) handleSignIn(new FormData(form));
                  }}
                  disabled={isSigningIn}
                  className="w-full h-11 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 
                    hover:to-pink-600 text-white rounded-xl font-medium transition-all duration-200 
                    shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.15)]"
                >
                  {isSigningIn ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    "Sign in"
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">or</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMuaLogin(true)}
                  className="w-full h-11 border-2 border-gray-200 text-gray-700 hover:text-purple-600 
                    hover:border-purple-100 hover:bg-purple-50/50 rounded-xl font-medium transition-all duration-200"
                >
                  Sign in as MUA
                </Button>
              </div>

              <FormMessage message={searchParams} />
            </form>
          </div>
        </div>
      ) : (
        // MUA Login Form
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold bg-gradient-to-r from-[#1e40af] to-[#6b21a8] bg-clip-text text-transparent">
                MUA Portal
              </h1>
              <p className="mt-2 text-gray-600">
                Want to be a MUA?{" "}
                <Link href="/mua-sign-up" className="text-purple-600 hover:text-purple-700 font-medium transition-colors">
                  Apply now
                </Link>
              </p>
            </div>

            <form className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="streamerEmail" className="text-sm font-medium text-gray-700">Email Address</Label>
                <div className="relative">
                  <Input 
                    name="email" 
                    placeholder="name@example.com" 
                    required 
                    className="h-11 pl-4 bg-gray-50/50 border-gray-200 focus:bg-white text-base rounded-xl
                      focus:ring-2 focus:ring-purple-100 focus:border-purple-600 transition-all duration-200"
                    style={{ fontSize: '16px' }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="streamerPassword" className="text-sm font-medium text-gray-700">Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    required
                    className="h-11 pl-4 pr-11 bg-gray-50/50 border-gray-200 focus:bg-white text-base rounded-xl
                      focus:ring-2 focus:ring-purple-100 focus:border-purple-600 transition-all duration-200"
                    style={{ fontSize: '16px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-6 pt-2">
                <Button 
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget.closest('form');
                    if (form) handleSignInAsMua(new FormData(form));
                  }}
                  disabled={isSigningInAsMua}
                  className="w-full h-11 bg-gradient-to-r from-[#1e40af] to-[#6b21a8] hover:from-[#1e3a8a] 
                    hover:to-[#581c87] text-white rounded-xl font-medium transition-all duration-200 
                    shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.15)]"
                >
                  {isSigningInAsMua ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    "Sign in as MUA"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMuaLogin(false)}
                  className="w-full h-11 border-2 border-gray-200 text-gray-700 hover:text-rose-600 
                    hover:border-rose-100 hover:bg-rose-50/50 rounded-xl font-medium transition-all duration-200"
                >
                  Back to MUSE Login
                </Button>
              </div>

              <FormMessage message={searchParams} />
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
