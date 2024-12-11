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
        setDocError('Ukuran file tidak boleh lebih dari 5MB');
        return;
      }
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setDocError('Hanya file PDF dan DOC/DOCX yang diperbolehkan');
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
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="first_name" className="text-gray-700">Nama Depan</Label>
            <Input 
              name="first_name"
              value={formData.basicInfo.first_name}
              onChange={(e) => updateFormData('basicInfo', 'first_name', e.target.value)}
              placeholder="John" 
              required 
              className="h-11 bg-gray-50/50 border-gray-200 focus:bg-white text-base"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="last_name" className="text-gray-700">Nama Belakang</Label>
            <Input 
              name="last_name"
              value={formData.basicInfo.last_name}
              onChange={(e) => updateFormData('basicInfo', 'last_name', e.target.value)}
              placeholder="Smith" 
              required 
              className="h-11 bg-gray-50/50 border-gray-200 focus:bg-white text-base"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="email" className="text-gray-700">Alamat Email</Label>
          <Input 
            name="email"
            type="email"
            value={formData.basicInfo.email}
            onChange={(e) => updateFormData('basicInfo', 'email', e.target.value)}
            placeholder="nama@contoh.com" 
            required 
            className="h-11 bg-gray-50/50 border-gray-200 focus:bg-white text-base"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="location" className="text-gray-700">Lokasi</Label>
          <Input 
            name="location"
            value={formData.basicInfo.location}
            onChange={(e) => updateFormData('basicInfo', 'location', e.target.value)}
            placeholder="Jakarta, Surabaya, dll" 
            required 
            className="h-11 bg-gray-50/50 border-gray-200 focus:bg-white text-base"
          />
        </div>
      </div>
    );
  };

  const renderSecurity = () => {
    return (
      <div className="space-y-5">
        <div className="space-y-1">
          <Label htmlFor="password" className="text-gray-700">Kata Sandi</Label>
          <Input
            type="password"
            name="password"
            value={formData.security.password}
            onChange={(e) => updateFormData('security', 'password', e.target.value)}
            placeholder="Buat kata sandi"
            minLength={6}
            required
            className="h-11 bg-gray-50/50 border-gray-200 focus:bg-white text-base"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="confirm_password" className="text-gray-700">Konfirmasi Kata Sandi</Label>
          <Input
            type="password"
            name="confirm_password"
            value={formData.security.confirm_password}
            onChange={(e) => updateFormData('security', 'confirm_password', e.target.value)}
            placeholder="Konfirmasi kata sandi"
            minLength={6}
            required
            className="h-11 bg-gray-50/50 border-gray-200 focus:bg-white text-base"
          />
        </div>
      </div>
    );
  };

  const renderBrandInfo = () => {
    return (
      <div className="space-y-5">
        <div className="space-y-1">
          <Label htmlFor="brand_name" className="text-gray-700">Nama Brand</Label>
          <Input 
            name="brand_name"
            value={formData.brandInfo.brand_name}
            onChange={(e) => updateFormData('brandInfo', 'brand_name', e.target.value)}
            placeholder="Nama brand Anda" 
            required 
            className="h-11 bg-gray-50/50 border-gray-200 focus:bg-white text-base"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="brand_description" className="text-gray-700">Deskripsi Brand</Label>
          <Textarea 
            name="brand_description"
            value={formData.brandInfo.brand_description}
            onChange={(e) => updateFormData('brandInfo', 'brand_description', e.target.value)}
            placeholder="Ceritakan tentang brand Anda" 
            className="min-h-[100px] bg-gray-50/50 border-gray-200 focus:bg-white text-sm"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="brand_doc" className="text-gray-700">Brand Guideline PDF</Label>
          <div className="relative">
            <Input
              type="file"
              name="brand_doc"
              id="brand_doc"
              accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleDocumentChange}
              className="hidden"
              ref={fileInputRef}
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer group flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50/50"
            >
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-400 group-hover:text-blue-500 mb-2 transition-colors" />
                <span className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors">
                  {formData.brandInfo.brand_doc ? formData.brandInfo.brand_doc.name : 'Klik untuk upload Brand Guidelines'}
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  PDF atau DOC maksimal 5MB
                </p>
              </div>
            </div>
          </div>
          {formData.brandInfo.brand_doc && (
            <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
              <Check className="h-4 w-4" />
              File terpilih: {formData.brandInfo.brand_doc.name}
            </p>
          )}
          {docError && (
            <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {docError}
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderPreview = () => {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Selamat! 🎉
          </h2>
          <p className="text-gray-600">
            Anda selangkah lagi menjadi client di platform kami.
            Mari kita tinjau informasi Anda sekali lagi.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700">Informasi Dasar</h4>
              <div className="mt-2 text-sm space-y-1">
                <p>Nama: {formData.basicInfo.first_name} {formData.basicInfo.last_name}</p>
                <p>Email: {formData.basicInfo.email}</p>
                <p>Lokasi: {formData.basicInfo.location}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700">Informasi Brand</h4>
              <div className="mt-2 text-sm space-y-1">
                <p>Nama Brand: {formData.brandInfo.brand_name}</p>
                <p>Deskripsi: {formData.brandInfo.brand_description}</p>
                {formData.brandInfo.brand_doc && (
                  <p>Brand Guidelines: {formData.brandInfo.brand_doc.name}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-start space-x-2 mt-6">
          <Checkbox
            id="terms"
            checked={acceptedTerms}
            onCheckedChange={(checked: boolean) => setAcceptedTerms(checked)}
            className="mt-1"
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor="terms"
              className="text-sm text-gray-600 leading-relaxed cursor-pointer"
            >
              Saya menyetujui{" "}
              <Link 
                href="/terms" 
                className="text-blue-600 hover:text-blue-700 font-medium underline"
                target="_blank"
              >
                persyaratan menggunakan aplikasi
              </Link>
              {" "}dan{" "}
              <Link 
                href="/privacy-notice" 
                className="text-blue-600 hover:text-blue-700 font-medium underline"
                target="_blank"
              >
                privacy agreement
              </Link>
              {" "}untuk menggunakan aplikasi ini
            </label>
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
    <div className="w-full max-w-[480px]">
      <div className="mb-8 flex justify-center lg:hidden">
        <Image
          src="/images/salda-logoB.png"
          alt="Salda Logo"
          width={150}
          height={150}
          priority
          className="w-auto h-auto"
        />
      </div>

      <div className="overflow-hidden rounded-xl bg-white/95 backdrop-blur-sm shadow-2xl">
        <div className="px-6 py-8 sm:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              Buat Akun Baru
            </h1>
            <p className="mt-2 text-gray-600">
              Sudah punya akun?{" "}
              <Link href="/sign-in" className="text-blue-600 hover:text-blue-700 font-medium">
                Masuk disini
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
  );
}
