"use client";

import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { useState, useRef } from "react";
import Image from "next/image";
import { Info, ArrowLeft, ArrowRight, Upload, Check, AlertCircle } from 'lucide-react';
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { SignUpResponse } from "@/app/types/auth";

interface FormData {
  basicInfo: {
    first_name: string;
    last_name: string;
    email: string;
    location: string;
  };
  security: {
    password: string;
    confirm_password: string;
  };
  brandInfo: {
    brand_name: string;
    brand_description: string;
    brand_doc: File | null;
  };
}

export default function Signup({ searchParams }: { searchParams: Message }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    basicInfo: {
      first_name: '',
      last_name: '',
      email: '',
      location: '',
    },
    security: {
      password: '',
      confirm_password: '',
    },
    brandInfo: {
      brand_name: '',
      brand_description: '',
      brand_doc: null,
    }
  });

  const [isSigningUp, setIsSigningUp] = useState(false);
  const [docError, setDocError] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add state for password
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const updateFormData = (step: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [step]: {
        ...prev[step as keyof FormData],
        [field]: value
      }
    }));
  };

  const validateStep = (step: number): boolean => {
    setError(null);
    
    switch (step) {
      case 1: // Basic Info
        const { first_name, last_name, email, location } = formData.basicInfo;
        if (!first_name || !last_name || !email || !location) {
          setError('Mohon lengkapi semua field yang diperlukan');
          return false;
        }
        if (!email.includes('@')) {
          setError('Mohon masukkan alamat email yang valid');
          return false;
        }
        break;
        
      case 2: // Security
        const { password, confirm_password } = formData.security;
        if (!password || !confirm_password) {
          setError('Mohon lengkapi semua field yang diperlukan');
          return false;
        }
        if (password !== confirm_password) {
          setError('Kata sandi tidak cocok');
          return false;
        }
        if (password.length < 6) {
          setError('Kata sandi minimal 6 karakter');
          return false;
        }
        break;
        
      case 3: // Brand Info
        const { brand_name, brand_description } = formData.brandInfo;
        if (!brand_name || !brand_description) {
          setError('Mohon lengkapi informasi brand Anda');
          return false;
        }
        break;
    }
    
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setDocError('File size must not exceed 5MB');
        return;
      }
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setDocError('Only PDF and DOC/DOCX files are allowed');
        return;
      }
      updateFormData('brandInfo', 'brand_doc', file);
      setDocError('');
    }
  };

  const renderStepIndicator = () => {
    return (
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === currentStep
                  ? 'bg-blue-600 text-white'
                  : step < currentStep
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step < currentStep ? '✓' : step}
            </div>
            {step < 4 && (
              <div
                className={`w-12 h-1 ${
                  step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderBasicInfo = () => {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="first_name" className="text-gray-700 font-medium">First Name</Label>
            <Input 
              name="first_name"
              value={formData.basicInfo.first_name}
              onChange={(e) => updateFormData('basicInfo', 'first_name', e.target.value)}
              placeholder="John" 
              required 
              className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500
                transition-all duration-200 text-base rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name" className="text-gray-700 font-medium">Last Name</Label>
            <Input 
              name="last_name"
              value={formData.basicInfo.last_name}
              onChange={(e) => updateFormData('basicInfo', 'last_name', e.target.value)}
              placeholder="Smith" 
              required 
              className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500
                transition-all duration-200 text-base rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
          <div className="relative">
            <Input 
              name="email"
              type="email"
              value={formData.basicInfo.email}
              onChange={(e) => updateFormData('basicInfo', 'email', e.target.value)}
              placeholder="you@example.com" 
              required 
              className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500
                transition-all duration-200 text-base rounded-xl pl-12"
            />
            <svg 
              className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500" />
            We'll send important updates to this email
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location" className="text-gray-700 font-medium">Location</Label>
          <div className="relative">
            <Input 
              name="location"
              value={formData.basicInfo.location}
              onChange={(e) => updateFormData('basicInfo', 'location', e.target.value)}
              placeholder="e.g. Jakarta" 
              required 
              className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500
                transition-all duration-200 text-base rounded-xl pl-12"
            />
            <svg 
              className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 mt-3">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span>Major cities: Jakarta, Bandung, Surabaya, Medan, Semarang, Yogyakarta</span>
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderSecurity = () => {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.security.password}
              onChange={(e) => updateFormData('security', 'password', e.target.value)}
              placeholder="Create a secure password"
              minLength={6}
              required
              className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500
                transition-all duration-200 text-base rounded-xl pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 
                hover:text-gray-600 transition-colors"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm_password" className="text-gray-700 font-medium">Confirm Password</Label>
          <div className="relative">
            <Input
              type={showConfirmPassword ? "text" : "password"}
              name="confirm_password"
              value={formData.security.confirm_password}
              onChange={(e) => updateFormData('security', 'confirm_password', e.target.value)}
              placeholder="Confirm your password"
              minLength={6}
              required
              className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500
                transition-all duration-200 text-base rounded-xl pr-12"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 
                hover:text-gray-600 transition-colors"
            >
              {showConfirmPassword ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Password Requirements:</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-gray-400" />
              Minimum 6 characters
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-gray-400" />
              Mix of letters and numbers recommended
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-gray-400" />
              Special characters add extra security
            </li>
          </ul>
        </div>
      </div>
    );
  };

  const renderBrandInfo = () => {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Label htmlFor="brand_name" className="text-gray-700 font-medium">Brand Name</Label>
          <Input 
            name="brand_name"
            value={formData.brandInfo.brand_name}
            onChange={(e) => updateFormData('brandInfo', 'brand_name', e.target.value)}
            placeholder="Your brand name" 
            required 
            className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500
              transition-all duration-200 text-base rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="brand_description" className="text-gray-700 font-medium">Brand Description</Label>
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500" />
            Tell us about your brand and its values
          </p>
          <Textarea 
            name="brand_description"
            value={formData.brandInfo.brand_description}
            onChange={(e) => updateFormData('brandInfo', 'brand_description', e.target.value)}
            placeholder="Describe your brand's story, mission, and target audience" 
            className="min-h-[120px] bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500
              transition-all duration-200 text-base rounded-xl resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="brand_doc" className="text-gray-700 font-medium">Brand Guidelines</Label>
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500" />
            Upload your brand guidelines document to share with streamers
          </p>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer group"
          >
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8
              transition-all duration-200 hover:border-blue-500 hover:bg-blue-50/50">
              <div className="flex flex-col items-center">
                <div className="p-4 rounded-full bg-gray-50 mb-4 
                  group-hover:bg-blue-100/50 transition-colors">
                  <svg 
                    className="w-8 h-8 text-gray-400 group-hover:text-blue-500" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600 group-hover:text-blue-600">
                  {formData.brandInfo.brand_doc ? formData.brandInfo.brand_doc.name : 'Upload Brand Guidelines'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF or DOC up to 5MB
                </p>
              </div>
            </div>
          </div>
          {formData.brandInfo.brand_doc && (
            <p className="text-sm text-green-600 mt-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              File selected: {formData.brandInfo.brand_doc.name}
            </p>
          )}
          {docError && (
            <p className="text-sm text-red-600 mt-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {docError}
            </p>
          )}
          <input
            type="file"
            name="brand_doc"
            accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleDocumentChange}
            ref={fileInputRef}
            className="hidden"
          />
        </div>

        <div className="p-4 bg-gray-50 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-gray-700">
            <Info className="w-4 h-4" />
            <span className="text-sm font-medium">Brand Guidelines Tips</span>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-gray-400" />
              Include your brand's color palette and typography
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-gray-400" />
              Specify do's and don'ts for brand representation
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-gray-400" />
              Add examples of successful brand content
            </li>
          </ul>
        </div>
      </div>
    );
  };

  const renderPreview = () => {
    return (
      <div className="space-y-8">
        <div className="bg-[#faf9f6] rounded-2xl p-6 border border-[#f0f0ef]">
          <div className="text-sm font-medium text-gray-600 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Account Preview
          </div>

          <div className="grid gap-6">
            {/* Basic Information */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-4">
              <h3 className="text-sm font-medium text-gray-900 pb-2 border-b border-gray-100">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Brand Name</span>
                  <p className="font-medium text-gray-900 mt-0.5">{formData.brandInfo.brand_name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Contact Person</span>
                  <p className="font-medium text-gray-900 mt-0.5">
                    {formData.basicInfo.first_name} {formData.basicInfo.last_name}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Email</span>
                  <p className="font-medium text-gray-900 mt-0.5">{formData.basicInfo.email}</p>
                </div>
                <div>
                  <span className="text-gray-500">Location</span>
                  <p className="font-medium text-gray-900 mt-0.5">{formData.basicInfo.location}</p>
                </div>
              </div>
            </div>

            {/* Brand Information */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-4">
              <h3 className="text-sm font-medium text-gray-900 pb-2 border-b border-gray-100">
                Brand Information
              </h3>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-500">Description</span>
                  <p className="text-gray-900 mt-1.5">{formData.brandInfo.brand_description}</p>
                </div>
                {formData.brandInfo.brand_doc && (
                  <div>
                    <span className="text-sm text-gray-500">Brand Guidelines</span>
                    <p className="font-medium text-gray-900 mt-1.5 flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {formData.brandInfo.brand_doc.name}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
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
                className="text-sm text-gray-600 leading-relaxed"
              >
                I agree to the{" "}
                <Link 
                  href="/terms" 
                  className="text-blue-600 hover:text-blue-700 font-medium underline"
                  target="_blank"
                >
                  Terms of Service
                </Link>
                {" "}and{" "}
                <Link 
                  href="/privacy-notice" 
                  className="text-blue-600 hover:text-blue-700 font-medium underline"
                  target="_blank"
                >
                  Privacy Policy
                </Link>
              </label>
              <p className="text-xs text-gray-500">
                By creating an account, you agree to our terms and conditions
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleSignUp = async () => {
    try {
      setError(null);
      setIsSigningUp(true);

      const submitFormData = new FormData();
      
      // Add basic info
      Object.entries(formData.basicInfo).forEach(([key, value]) => {
        submitFormData.append(key, value);
      });
      
      // Add password
      submitFormData.append('password', formData.security.password);
      
      // Add brand info
      submitFormData.append('brand_name', formData.brandInfo.brand_name);
      submitFormData.append('brand_description', formData.brandInfo.brand_description);
      
      // Add brand doc if exists
      if (formData.brandInfo.brand_doc) {
        submitFormData.append('brand_doc', formData.brandInfo.brand_doc);
      }

      const result: SignUpResponse = await signUpAction(submitFormData);
      
      if (result.success && result.redirectTo) {
        window.location.href = result.redirectTo;
      } else {
        setError(result.error || 'An unexpected error occurred');
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
      <div className="w-full max-w-[580px] mx-auto">
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_0_50px_0_rgba(0,0,0,0.1)] backdrop-blur-lg">
          <div className="px-5 py-8 sm:px-10 sm:py-12">
            <div className="mb-8 sm:mb-12">
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
                Create Brand Account
              </h1>
              <p className="mt-2 sm:mt-3 text-gray-500">
                Already have an account?{" "}
                <Link href="/sign-in" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                  Sign in here
                </Link>
              </p>
            </div>

            {renderStepIndicator()}

            <form className="space-y-6">
              {currentStep === 1 && renderBasicInfo()}
              {currentStep === 2 && renderSecurity()}
              {currentStep === 3 && renderBrandInfo()}
              {currentStep === 4 && renderPreview()}

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    onClick={handlePrevious}
                    className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-700"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Sebelumnya
                  </Button>
                )}
                
                <Button
                  type="button"
                  onClick={currentStep === 4 ? handleSignUp : handleNext}
                  disabled={currentStep === 4 && !acceptedTerms}
                  className={`flex-1 h-11 bg-gradient-to-r from-blue-600 to-blue-500 
                    ${currentStep === 4 && !acceptedTerms 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:from-blue-700 hover:to-blue-600'
                    } text-white`}
                >
                  {currentStep === 4 ? (
                    isSigningUp ? "Membuat Akun..." : "Buat Akun"
                  ) : (
                    <>
                      Lanjut
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>

              <FormMessage message={searchParams} />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
