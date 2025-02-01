"use client";

import { signInAction, signInAsStreamerAction } from "@/app/actions";
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
  const [isSigningInAsStreamer, setIsSigningInAsStreamer] = useState(false);
  const [showStreamerLogin, setShowStreamerLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async (formData: FormData) => {
    setIsSigningIn(true);
    await signInAction(formData);
    setIsSigningIn(false);
  };

  const handleSignInAsStreamer = async (formData: FormData) => {
    setIsSigningInAsStreamer(true);
    await signInAsStreamerAction(formData);
    setIsSigningInAsStreamer(false);
  };

  return (
    <div className="relative w-full max-w-[420px]">

      {!showStreamerLogin ? (
        // Client Login Form
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Welcome Back
              </h1>
              <p className="mt-2 text-gray-600">
                New to Salda?{" "}
                <Link href="/sign-up" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                  Create an account
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
                      focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all duration-200"
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
                      focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all duration-200"
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
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 
                    hover:to-indigo-700 text-white rounded-xl font-medium transition-all duration-200 
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
                  onClick={() => setShowStreamerLogin(true)}
                  className="w-full h-11 border-2 border-gray-200 text-gray-700 hover:text-blue-600 
                    hover:border-blue-100 hover:bg-blue-50/50 rounded-xl font-medium transition-all duration-200"
                >
                  Sign in as Streamer
                </Button>
              </div>

              <FormMessage message={searchParams} />
            </form>
          </div>
        </div>
      ) : (
        // Streamer Login Form
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold bg-gradient-to-r from-[#1e40af] to-[#6b21a8] bg-clip-text text-transparent">
                Streamer Portal
              </h1>
              <p className="mt-2 text-gray-600">
                Want to be a streamer?{" "}
                <Link href="/streamer-sign-up" className="text-[#2563eb] hover:text-[#1e40af] font-medium transition-colors">
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
                    if (form) handleSignInAsStreamer(new FormData(form));
                  }}
                  disabled={isSigningInAsStreamer}
                  className="w-full h-11 bg-gradient-to-r from-[#1e40af] to-[#6b21a8] hover:from-[#1e3a8a] 
                    hover:to-[#581c87] text-white rounded-xl font-medium transition-all duration-200 
                    shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.15)]"
                >
                  {isSigningInAsStreamer ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    "Sign in as Streamer"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowStreamerLogin(false)}
                  className="w-full h-11 border-2 border-gray-200 text-gray-700 hover:text-[#2563eb] 
                    hover:border-blue-100 hover:bg-blue-50/50 rounded-xl font-medium transition-all duration-200"
                >
                  Back to Brand Login
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
