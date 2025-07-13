"use client";

import { signUpMuaAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, Palette, Sparkles } from 'lucide-react';

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

export default function MuaSignup({ searchParams }: { searchParams: Message }) {
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
      
      submitFormData.append('user_type', 'mua');

      const result = await signUpMuaAction(submitFormData);
      
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
    <div className="min-h-screen bg-white flex items-center justify-center py-12 px-6">
      <div className="w-full max-w-md">
        {/* Back to Home */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <div className="text-center">
              <h1 className="editorial-title text-black mb-2">MUSE</h1>
              <div className="w-12 h-px bg-black mx-auto mb-1"></div>
              <p className="editorial-caption text-vogue-silver">MODELS</p>
            </div>
          </Link>
        </div>

        {/* Main Form Container */}
        <div className="bg-white">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="editorial-headline text-black mb-4">
              Join as MUA
            </h2>
            <p className="editorial-body text-vogue-charcoal mb-6">
              Create your professional makeup artist profile and connect with talent
            </p>
            <div className="w-16 h-px bg-vogue-gold mx-auto"></div>
          </div>

          <form onSubmit={handleSignUp} className="space-y-8">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label variant="form-luxury">First Name</Label>
                <Input 
                  name="first_name"
                  value={formData.first_name}
                  onChange={(e) => updateFormData('first_name', e.target.value)}
                  placeholder="First name" 
                  required 
                  variant="luxury"
                />
              </div>
              <div className="space-y-3">
                <Label variant="form-luxury">Last Name</Label>
                <Input 
                  name="last_name"
                  value={formData.last_name}
                  onChange={(e) => updateFormData('last_name', e.target.value)}
                  placeholder="Last name" 
                  required 
                  variant="luxury"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-3">
              <Label variant="form-luxury">Email Address</Label>
              <Input 
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                placeholder="your@email.com" 
                required 
                variant="luxury"
              />
            </div>

            {/* Location */}
            <div className="space-y-3">
              <Label variant="form-luxury">City</Label>
              <Select value={formData.location} onValueChange={(value) => updateFormData('location', value)}>
                <SelectTrigger className="h-12 rounded-none border-0 border-b-2 border-black bg-transparent px-0 py-3 text-base focus:border-vogue-gold focus:ring-0 focus:ring-offset-0">
                  <SelectValue placeholder="Select your city" className="text-vogue-silver" />
                </SelectTrigger>
                <SelectContent className="rounded-sm border-black">
                  {locationOptions.map((location) => (
                    <SelectItem key={location} value={location} className="font-body">{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Password */}
            <div className="space-y-3">
              <Label variant="form-luxury">Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  required
                  variant="luxury"
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 text-vogue-silver hover:text-black transition-colors duration-300 p-3"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-3">
              <Label variant="form-luxury">Confirm Password</Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={(e) => updateFormData('confirm_password', e.target.value)}
                  placeholder="Repeat your password"
                  minLength={6}
                  required
                  variant="luxury"
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 text-vogue-silver hover:text-black transition-colors duration-300 p-3"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="bg-vogue-cream border border-black/10 p-8 mt-8">
              <div className="flex items-start space-x-4">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked: boolean) => setAcceptedTerms(checked)}
                  className="mt-1 border-black data-[state=checked]:bg-black data-[state=checked]:border-black"
                />
                <div className="space-y-3">
                  <label
                    htmlFor="terms"
                    className="editorial-body text-vogue-charcoal leading-relaxed cursor-pointer block"
                  >
                    I agree to the{" "}
                    <Link 
                      href="/terms" 
                      className="text-black hover:text-vogue-gold font-medium underline underline-offset-2 transition-colors duration-300"
                      target="_blank"
                    >
                      Terms of Service
                    </Link>
                    {" "}and{" "}
                    <Link 
                      href="/privacy-notice" 
                      className="text-black hover:text-vogue-gold font-medium underline underline-offset-2 transition-colors duration-300"
                      target="_blank"
                    >
                      Privacy Policy
                    </Link>
                  </label>
                  <p className="editorial-caption text-vogue-silver">
                    COMPLETE YOUR PORTFOLIO LATER IN ACCOUNT SETTINGS
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-sm">
                <p className="editorial-body text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSigningUp}
              variant="luxury"
              size="luxury-lg"
              className="w-full mt-8"
            >
              {isSigningUp ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>CREATING ACCOUNT...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <Sparkles className="w-4 h-4" />
                  <span>CREATE MUA ACCOUNT</span>
                </div>
              )}
            </Button>

            <FormMessage message={searchParams} />
          </form>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-black/10 text-center">
            <p className="editorial-caption text-vogue-silver mb-4">
              ALREADY HAVE AN ACCOUNT?
            </p>
            <Link 
              href="/sign-in" 
              className="editorial-caption text-black hover:text-vogue-gold transition-colors duration-300"
            >
              SIGN IN HERE
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}