"use client";

import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function Login({ searchParams }: { searchParams: Message }) {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = async (formData: FormData) => {
    setIsSigningIn(true);
    await signInAction(formData);
    setIsSigningIn(false);
  };

  return (
    <div className="min-h-screen bg-old-money-ivory flex items-center justify-center py-12 px-6">
      <div className="w-full max-w-md">
        <div className="relative">
          {/* Back to Home */}
          <div className="mb-8 text-center">
            <Link href="/" className="inline-block">
              <div className="text-center">
                <h1 className="editorial-title text-old-money-navy mb-2">MUSE</h1>
                <div className="w-12 h-px bg-old-money-navy mx-auto mb-1"></div>
                <p className="editorial-caption text-old-money-stone">TALENT COLLECTIVE</p>
              </div>
            </Link>
          </div>

          {/* Elegant Header */}
          <div className="text-center mb-12">
            <h2 className="editorial-headline text-old-money-navy mb-6">
              Welcome Back
            </h2>
            <p className="editorial-body text-old-money-charcoal mb-8">
              Access your exclusive talent network
            </p>
            <div className="w-16 h-px bg-old-money-sage mx-auto"></div>
          </div>

          {/* Sign In Form */}
          <form className="space-y-8">
            <div className="space-y-4">
              <Label variant="form-luxury" className="text-old-money-navy">Email Address</Label>
              <Input
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                variant="luxury"
                className="border-old-money-sage focus:border-old-money-navy bg-white"
              />
            </div>

            <div className="space-y-4">
              <Label variant="form-luxury" className="text-old-money-navy">Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  variant="luxury"
                  className="border-old-money-sage focus:border-old-money-navy bg-white pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 text-old-money-stone hover:text-old-money-navy transition-colors duration-300 p-3"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="text-center">
              <Link 
                href="/forgot-password" 
                className="editorial-caption text-old-money-stone hover:text-old-money-navy transition-colors duration-300"
              >
                FORGOT PASSWORD?
              </Link>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              onClick={(e) => {
                e.preventDefault();
                const form = e.currentTarget.closest('form');
                if (form) handleSignIn(new FormData(form));
              }}
              disabled={isSigningIn}
              className="w-full h-14 bg-old-money-navy hover:bg-old-money-charcoal text-old-money-ivory font-body font-medium tracking-wider uppercase text-sm transition-all duration-500"
            >
              {isSigningIn ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                  <span>SIGNING IN...</span>
                </div>
              ) : (
                <span>SIGN IN</span>
              )}
            </Button>

            <FormMessage message={searchParams} />
          </form>

          {/* Sign Up Section */}
          <div className="mt-12 pt-8 border-t border-old-money-pearl text-center">
            <p className="editorial-body text-old-money-charcoal mb-6">
              New to the platform?
            </p>
            <Link 
              href="/talent-sign-up" 
              className="editorial-caption text-old-money-navy hover:text-old-money-charcoal transition-colors duration-300"
            >
              CREATE ACCOUNT
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}