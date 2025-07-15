"use client";

import { signUpMuaAction, signUpMuseAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff } from 'lucide-react';

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

export default function TalentSignup({ searchParams }: { searchParams: Message }) {
  const [userType, setUserType] = useState<'muse' | 'mua'>('muse');
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
      
      submitFormData.append('user_type', userType);

      // Call appropriate action based on user type
      const result = userType === 'mua' 
        ? await signUpMuaAction(submitFormData)
        : await signUpMuseAction(submitFormData);
      
      if (result.success && result.redirectTo) {
        if (result.message) {
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
    <div className="min-h-screen bg-old-money-ivory flex items-center justify-center py-12 px-6">
      <div className="w-full max-w-md">
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

        {/* User Type Selector */}
        <div className="mb-8">
          <div className="flex bg-old-money-pearl rounded-sm p-1">
            <button
              type="button"
              onClick={() => setUserType('muse')}
              className={`flex-1 py-3 px-4 text-sm font-medium tracking-wider uppercase transition-all duration-300 ${
                userType === 'muse'
                  ? 'bg-old-money-navy text-old-money-ivory'
                  : 'text-old-money-navy hover:text-old-money-charcoal'
              }`}
            >
              MODEL / TALENT
            </button>
            <button
              type="button"
              onClick={() => setUserType('mua')}
              className={`flex-1 py-3 px-4 text-sm font-medium tracking-wider uppercase transition-all duration-300 ${
                userType === 'mua'
                  ? 'bg-old-money-navy text-old-money-ivory'
                  : 'text-old-money-navy hover:text-old-money-charcoal'
              }`}
            >
              MAKEUP ARTIST
            </button>
          </div>
        </div>

        {/* Dynamic Header */}
        <div className="text-center mb-12">
          <h2 className="editorial-headline text-old-money-navy mb-4">
            {userType === 'muse' ? 'Join as Talent' : 'Join as MUA'}
          </h2>
          <p className="editorial-body text-old-money-charcoal mb-6">
            {userType === 'muse' 
              ? 'Showcase your talent and connect with professionals'
              : 'Create your professional makeup artist profile'
            }
          </p>
          <div className="w-16 h-px bg-old-money-sage mx-auto"></div>
        </div>

        <form onSubmit={handleSignUp} className="space-y-8">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label variant="form-luxury" className="text-old-money-navy">First Name</Label>
              <Input 
                name="first_name"
                value={formData.first_name}
                onChange={(e) => updateFormData('first_name', e.target.value)}
                placeholder="First name" 
                required 
                variant="luxury"
                className="border-old-money-sage focus:border-old-money-navy bg-white"
              />
            </div>
            <div className="space-y-3">
              <Label variant="form-luxury" className="text-old-money-navy">Last Name</Label>
              <Input 
                name="last_name"
                value={formData.last_name}
                onChange={(e) => updateFormData('last_name', e.target.value)}
                placeholder="Last name" 
                required 
                variant="luxury"
                className="border-old-money-sage focus:border-old-money-navy bg-white"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-3">
            <Label variant="form-luxury" className="text-old-money-navy">Email Address</Label>
            <Input 
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateFormData('email', e.target.value)}
              placeholder="your@email.com" 
              required 
              variant="luxury"
              className="border-old-money-sage focus:border-old-money-navy bg-white"
            />
          </div>

          {/* Location */}
          <div className="space-y-3">
            <Label variant="form-luxury" className="text-old-money-navy">City</Label>
            <Select value={formData.location} onValueChange={(value) => updateFormData('location', value)}>
              <SelectTrigger className="h-12 rounded-none border-0 border-b-2 border-old-money-sage bg-white px-0 py-3 text-base focus:border-old-money-navy focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="Select your city" className="text-old-money-stone" />
              </SelectTrigger>
              <SelectContent className="rounded-sm border-old-money-navy bg-white">
                {locationOptions.map((location) => (
                  <SelectItem key={location} value={location} className="font-body">{location}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Password */}
          <div className="space-y-3">
            <Label variant="form-luxury" className="text-old-money-navy">Password</Label>
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

          {/* Confirm Password */}
          <div className="space-y-3">
            <Label variant="form-luxury" className="text-old-money-navy">Confirm Password</Label>
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
                className="border-old-money-sage focus:border-old-money-navy bg-white pr-12"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 text-old-money-stone hover:text-old-money-navy transition-colors duration-300 p-3"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="bg-old-money-cream border border-old-money-sage/20 p-6 mt-8">
            <div className="flex items-start space-x-4">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked: boolean) => setAcceptedTerms(checked)}
                className="mt-1 border-old-money-navy data-[state=checked]:bg-old-money-navy data-[state=checked]:border-old-money-navy"
              />
              <div className="space-y-3">
                <label
                  htmlFor="terms"
                  className="editorial-body text-old-money-charcoal leading-relaxed cursor-pointer block"
                >
                  I agree to the{" "}
                  <Link 
                    href="/terms" 
                    className="text-old-money-navy hover:text-old-money-charcoal font-medium underline underline-offset-2 transition-colors duration-300"
                    target="_blank"
                  >
                    Terms of Service
                  </Link>
                  {" "}and{" "}
                  <Link 
                    href="/privacy-notice" 
                    className="text-old-money-navy hover:text-old-money-charcoal font-medium underline underline-offset-2 transition-colors duration-300"
                    target="_blank"
                  >
                    Privacy Policy
                  </Link>
                </label>
                <p className="editorial-caption text-old-money-stone">
                  {userType === 'mua' 
                    ? 'COMPLETE YOUR PORTFOLIO LATER IN ACCOUNT SETTINGS'
                    : 'ADD YOUR PORTFOLIO LATER IN PROFILE SETTINGS'
                  }
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
            className="w-full mt-8 bg-old-money-navy hover:bg-old-money-charcoal text-old-money-ivory"
          >
            {isSigningUp ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                <span>CREATING ACCOUNT...</span>
              </div>
            ) : (
              <span>
                {userType === 'mua' ? 'CREATE MUA ACCOUNT' : 'CREATE TALENT ACCOUNT'}
              </span>
            )}
          </Button>

          <FormMessage message={searchParams} />
        </form>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-old-money-pearl text-center">
          <p className="editorial-caption text-old-money-stone mb-4">
            ALREADY HAVE AN ACCOUNT?
          </p>
          <Link 
            href="/sign-in" 
            className="editorial-caption text-old-money-navy hover:text-old-money-charcoal transition-colors duration-300"
          >
            SIGN IN HERE
          </Link>
        </div>
      </div>
    </div>
  );
}