"use client";

import { signUpMuseAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, Camera, Heart, Sparkles } from 'lucide-react';

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirm_password: string;
  location: string;
}

const locationOptions = [
  'Jakarta',
  'Bandung',
  'Surabaya',
  'Yogyakarta',
  'Bali',
  'Medan',
  'Semarang',
  'Malang',
  'Makassar',
  'Palembang',
  'Denpasar',
  'Batam'
];

export default function MuseSignup({ searchParams }: { searchParams: Message }) {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    location: '',
  });

  const [isSigningUp, setIsSigningUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    setError(null);
    
    const { first_name, last_name, email, password, confirm_password, location } = formData;
    
    if (!first_name || !last_name || !email || !password || !confirm_password || !location) {
      setError('Please complete all required fields');
      return false;
    }
    
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (password !== confirm_password) {
      setError('Passwords do not match');
      return false;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    
    if (!acceptedTerms) {
      setError('Please accept the terms and conditions');
      return false;
    }
    
    return true;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setError(null);
      setIsSigningUp(true);

      const submitFormData = new FormData();
      
      // Add form data
      Object.entries(formData).forEach(([key, value]) => {
        submitFormData.append(key, value);
      });
      
      submitFormData.append('user_type', 'muse');

      const result = await signUpMuseAction(submitFormData);
      
      if (result.success && result.redirectTo) {
        // For email verification flow, we can show the message briefly before redirecting
        if (result.message) {
          // Optional: Show success message for a moment
          console.log(result.message);
        }
        window.location.href = result.redirectTo;
      } else if (result.error) {
        setError(result.error);
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <div className="w-full min-h-screen py-8 px-4 sm:py-12 sm:px-6">
      <div className="w-full max-w-[480px] mx-auto">
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_0_50px_0_rgba(0,0,0,0.1)] backdrop-blur-lg">
          <div className="px-5 py-8 sm:px-10 sm:py-12">
            <div className="mb-8 sm:mb-12">
              <h1 className="text-2xl sm:text-3xl font-semibold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent tracking-tight">
                Join as MUSE
              </h1>
              <p className="mt-2 sm:mt-3 text-gray-500">
                Already have an account?{" "}
                <Link href="/sign-in" className="text-rose-600 hover:text-rose-700 font-medium transition-colors">
                  Sign in here
                </Link>
              </p>
            </div>

            <form onSubmit={handleSignUp} className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="text-gray-700 font-medium">First Name</Label>
                  <Input 
                    name="first_name"
                    value={formData.first_name}
                    onChange={(e) => updateFormData('first_name', e.target.value)}
                    placeholder="Your first name" 
                    required 
                    className="h-12 bg-gray-50 border-gray-200 focus:border-rose-500 focus:ring-rose-500
                      transition-all duration-200 text-base rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name" className="text-gray-700 font-medium">Last Name</Label>
                  <Input 
                    name="last_name"
                    value={formData.last_name}
                    onChange={(e) => updateFormData('last_name', e.target.value)}
                    placeholder="Your last name" 
                    required 
                    className="h-12 bg-gray-50 border-gray-200 focus:border-rose-500 focus:ring-rose-500
                      transition-all duration-200 text-base rounded-xl"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
                <div className="relative">
                  <Input 
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    placeholder="you@example.com" 
                    required 
                    className="h-12 bg-gray-50 border-gray-200 focus:border-rose-500 focus:ring-rose-500
                      transition-all duration-200 text-base rounded-xl pl-12"
                  />
                  <Camera className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="text-gray-700 font-medium">City</Label>
                <Select value={formData.location} onValueChange={(value) => updateFormData('location', value)}>
                  <SelectTrigger className="h-12 bg-gray-50 border-gray-200 focus:border-rose-500 focus:ring-rose-500">
                    <SelectValue placeholder="Select your city" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationOptions.map((location) => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={(e) => updateFormData('password', e.target.value)}
                    placeholder="Create a secure password"
                    minLength={6}
                    required
                    className="h-12 bg-gray-50 border-gray-200 focus:border-rose-500 focus:ring-rose-500
                      transition-all duration-200 text-base rounded-xl pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 
                      hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirm_password" className="text-gray-700 font-medium">Confirm Password</Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={(e) => updateFormData('confirm_password', e.target.value)}
                    placeholder="Confirm your password"
                    minLength={6}
                    required
                    className="h-12 bg-gray-50 border-gray-200 focus:border-rose-500 focus:ring-rose-500
                      transition-all duration-200 text-base rounded-xl pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 
                      hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-6 border border-rose-100">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked: boolean) => setAcceptedTerms(checked)}
                    className="mt-1"
                  />
                  <div className="space-y-1">
                    <label
                      htmlFor="terms"
                      className="text-sm text-gray-600 leading-relaxed cursor-pointer"
                    >
                      I agree to the{" "}
                      <Link 
                        href="/terms" 
                        className="text-rose-600 hover:text-rose-700 font-medium underline"
                        target="_blank"
                      >
                        Terms of Service
                      </Link>
                      {" "}and{" "}
                      <Link 
                        href="/privacy-notice" 
                        className="text-rose-600 hover:text-rose-700 font-medium underline"
                        target="_blank"
                      >
                        Privacy Policy
                      </Link>
                    </label>
                    <p className="text-xs text-gray-500">
                      By creating a MUSE account, you can complete your profile later in your account settings
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSigningUp}
                className="w-full h-12 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 
                  hover:to-pink-600 text-white rounded-xl font-medium transition-all duration-200 
                  shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.15)]"
              >
                {isSigningUp ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Heart className="w-5 h-5" />
                    <span>Create MUSE Account</span>
                  </div>
                )}
              </Button>

              <FormMessage message={searchParams} />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}