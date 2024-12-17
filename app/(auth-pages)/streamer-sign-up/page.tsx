"use client";

import { streamerSignUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useState, useRef } from "react";
import Image from "next/image";
import { Info, ArrowLeft, ArrowRight, Youtube, HelpCircle } from 'lucide-react';
import { StreamerCard, Streamer } from "@/components/streamer-card";
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { SignUpResponse } from "@/app/types/auth";
import { createClient } from "@/utils/supabase/client";

const platforms = ["TikTok", "Shopee"];
const categories = ["Fashion", "Technology", "Beauty", "Gaming", "Cooking", "Fitness", "Music", "Others"];
const indonesiaCities = [
  "Jakarta", 
  "Surabaya", 
  "Bandung", 
  "Medan", 
  "Semarang", 
  "Makassar", 
  "Palembang", 
  "Tangerang",
  "Malang",  // Added new city
  "Bali"     // Added new city
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface GalleryImage {
  file: File;
  preview: string;
}

interface FormData {
  basicInfo: {
    first_name: string;
    last_name: string;
    email: string;
    city: string;
    full_address: string;
  };
  security: {
    password: string;
    confirm_password: string;
  };
  profile: {
    image: File | null;
    platforms: string[];
    categories: string[];
    price: string;
    bio: string;
    video_url: string;
    gallery: GalleryImage[];
  };
}

export default function StreamerSignUp({ searchParams }: { searchParams: Message }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    basicInfo: {
      first_name: '',
      last_name: '',
      email: '',
      city: '',
      full_address: '',
    },
    security: {
      password: '',
      confirm_password: '',
    },
    profile: {
      image: null,
      platforms: [],
      categories: [],
      price: '',
      bio: '',
      video_url: '',
      gallery: [],
    }
  });

  // Keep existing state variables that are still needed
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

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
        const { first_name, last_name, email, city, full_address } = formData.basicInfo;
        if (!first_name || !last_name || !email || !city || !full_address) {
          setError('Please fill in all required fields');
          return false;
        }
        if (!email.includes('@')) {
          setError('Please enter a valid email address');
          return false;
        }
        break;
        
      case 2: // Security
        const { password, confirm_password } = formData.security;
        if (!password || !confirm_password) {
          setError('Please fill in all required fields');
          return false;
        }
        if (password !== confirm_password) {
          setError('Passwords do not match');
          return false;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters long');
          return false;
        }
        break;
        
      case 3: // Profile
        const { image, platforms, categories, price } = formData.profile;
        if (!image) {
          setError('Please upload a profile image');
          return false;
        }
        if (platforms.length === 0) {
          setError('Please select at least one platform');
          return false;
        }
        if (categories.length === 0) {
          setError('Please select at least one category');
          return false;
        }
        if (!price) {
          setError('Please enter your price per hour');
          return false;
        }
        break;

      case 4: // Video
        if (!formData.profile.video_url) {
          setError('Please add your introduction video URL');
          return false;
        }
        const videoId = getYouTubeVideoId(formData.profile.video_url);
        if (!videoId) {
          setError('Please enter a valid YouTube video URL');
          return false;
        }
        break;

      case 5: // Gallery
        if (formData.profile.gallery.length === 0) {
          setError('Please add at least one photo to your gallery');
          return false;
        }
        break;
    }
    
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 6));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const validateFile = (file: File, type: 'image' | 'gallery'): string | null => {
    if (!file || file.size === 0) {
      return type === 'image' ? 'Please select a profile image' : null;
    }
    
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return 'Only JPG, PNG and WebP images are allowed';
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return 'File size should not exceed 5MB';
    }
    
    return null;
  };

  const handleSignUp = async () => {
    try {
      setError(null);
      setIsSigningUp(true);

      const supabase = createClient();
      const submitFormData = new FormData();

      // Add basic info
      submitFormData.append('first_name', formData.basicInfo.first_name);
      submitFormData.append('last_name', formData.basicInfo.last_name);
      submitFormData.append('email', formData.basicInfo.email);
      submitFormData.append('city', formData.basicInfo.city);
      submitFormData.append('full_address', formData.basicInfo.full_address);

      // Add security info
      submitFormData.append('password', formData.security.password);

      // Handle profile image upload to Supabase storage
      if (formData.profile.image) {
        const profileImageFile = formData.profile.image;
        submitFormData.append('image', profileImageFile);
      }

      // Handle gallery photos
      formData.profile.gallery.forEach(item => {
        submitFormData.append('gallery', item.file);
      });

      // Add platforms
      formData.profile.platforms.forEach(platform => {
        submitFormData.append('platforms', platform);
      });

      // Add categories
      formData.profile.categories.forEach(category => {
        submitFormData.append('categories', category);
      });

      // Add other profile fields
      submitFormData.append('price', formData.profile.price.replace(/\./g, ''));
      submitFormData.append('bio', formData.profile.bio);
      submitFormData.append('video_url', formData.profile.video_url);

      const result: SignUpResponse = await streamerSignUpAction(submitFormData);
      
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = 5 - formData.profile.gallery.length;
    if (remainingSlots <= 0) {
      setError('Maximum 5 photos allowed');
      return;
    }

    const newFiles = Array.from(files).slice(0, remainingSlots);
    
    newFiles.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        setError('Each file must be less than 5MB');
        return;
      }

      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setError('Only JPG and PNG files are allowed');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          profile: {
            ...prev.profile,
            gallery: [
              ...prev.profile.gallery,
              {
                file: file,
                preview: reader.result as string
              }
            ]
          }
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const formatPrice = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const formattedValue = formatPrice(rawValue);
    updateFormData('profile', 'price', formattedValue);
  };

  const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const renderStepIndicator = () => {
    return (
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3, 4, 5, 6].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === currentStep
                  ? 'bg-red-600 text-white'
                  : step < currentStep
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step < currentStep ? '✓' : step}
            </div>
            {step < 6 && (
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
          <Label htmlFor="city" className="text-gray-700">Kota</Label>
          <Select 
            value={formData.basicInfo.city}
            onValueChange={(value) => updateFormData('basicInfo', 'city', value)}
          >
            <SelectTrigger className="h-11 bg-gray-50/50 border-gray-200 focus:bg-white text-base">
              <SelectValue placeholder="Pilih kota" />
            </SelectTrigger>
            <SelectContent>
              {indonesiaCities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="full_address" className="text-gray-700">Alamat Lengkap</Label>
          <Textarea 
            name="full_address"
            value={formData.basicInfo.full_address}
            onChange={(e) => updateFormData('basicInfo', 'full_address', e.target.value)}
            placeholder="Masukkan alamat lengkap Anda" 
            required
            className="min-h-[80px] bg-gray-50/50 border-gray-200 focus:bg-white text-sm"
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

  const renderProfile = () => {
    return (
      <div className="space-y-8">
        {/* Profile Image Upload */}
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-gray-700">Foto Profil</Label>
            <p className="text-xs text-gray-500 italic flex items-center gap-1.5">
              <svg 
                className="w-4 h-4 text-blue-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              Upload foto profil terbaik Anda
            </p>
          </div>

          <div 
            onClick={() => fileInputRef.current?.click()}
            className="relative cursor-pointer group"
          >
            <div className={`
              aspect-[4/3] rounded-xl overflow-hidden border-2 border-dashed
              transition-all duration-200
              ${imagePreview 
                ? 'border-transparent' 
                : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50/50'
              }
            `}>
              {imagePreview ? (
                <Image 
                  src={imagePreview} 
                  alt="Profile preview" 
                  fill
                  className="object-cover" 
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="p-3 rounded-full bg-blue-50 mb-2 group-hover:bg-blue-100 transition-colors">
                    <svg 
                      className="w-6 h-6 text-blue-600" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors">
                    Upload Foto
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Klik untuk memilih foto
                  </p>
                </div>
              )}
            </div>

            {imagePreview && (
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                <p className="text-white font-medium">Ganti Foto</p>
              </div>
            )}
          </div>

          <Input 
            id="image"
            name="image" 
            type="file" 
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              handleImageChange(e);
              if (e.target.files?.[0]) {
                updateFormData('profile', 'image', e.target.files[0]);
              }
            }}
            ref={fileInputRef}
            className="hidden"
            required
          />
        </div>

        {/* Platform */}
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-gray-700">Platform</Label>
            <p className="text-xs text-gray-500 italic flex items-center gap-1.5">
              <svg 
                className="w-4 h-4 text-blue-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              Pilih satu atau lebih platform yang Anda gunakan secara aktif untuk live streaming
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {platforms.map((platform) => (
              <div
                key={platform}
                onClick={() => {
                  const newPlatforms = formData.profile.platforms.includes(platform)
                    ? formData.profile.platforms.filter(p => p !== platform)
                    : [...formData.profile.platforms, platform];
                  updateFormData('profile', 'platforms', newPlatforms);
                }}
                className={`cursor-pointer p-3 rounded-lg border transition-all duration-200 
                  ${formData.profile.platforms.includes(platform)
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                    : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50/50'
                  }
                  group flex items-center justify-between`}
              >
                <span className="text-sm font-medium">{platform}</span>
                <div className={`
                  transition-transform duration-200 transform
                  ${formData.profile.platforms.includes(platform) 
                    ? 'scale-100 opacity-100' 
                    : 'scale-0 opacity-0 group-hover:scale-90 group-hover:opacity-50'}
                `}>
                  <svg 
                    className="w-5 h-5 text-blue-500" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M5 13l4 4L19 7" 
                    />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-gray-700">Kategori</Label>
            <p className="text-xs text-gray-500 italic flex items-center gap-1.5">
              <svg 
                className="w-4 h-4 text-blue-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              Pilih kategori yang sesuai dengan konten dan keahlian Anda (bisa lebih dari satu)
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((category) => (
              <div
                key={category}
                onClick={() => {
                  const newCategories = formData.profile.categories.includes(category)
                    ? formData.profile.categories.filter(c => c !== category)
                    : [...formData.profile.categories, category];
                  updateFormData('profile', 'categories', newCategories);
                }}
                className={`cursor-pointer p-3 rounded-lg border transition-all duration-200 
                  ${formData.profile.categories.includes(category)
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                    : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50/50'
                  }
                  group flex items-center justify-between`}
              >
                <span className="text-sm font-medium">{category}</span>
                <div className={`
                  transition-transform duration-200 transform
                  ${formData.profile.categories.includes(category) 
                    ? 'scale-100 opacity-100' 
                    : 'scale-0 opacity-0 group-hover:scale-90 group-hover:opacity-50'}
                `}>
                  <svg 
                    className="w-5 h-5 text-blue-500" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M5 13l4 4L19 7" 
                    />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Price */}
        <div className="space-y-1">
          <Label htmlFor="price" className="text-gray-700">Harga (per jam)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rp.</span>
            <Input
              name="price"
              type="text"
              inputMode="numeric"
              value={formData.profile.price}
              onChange={handlePriceChange}
              className="pl-12 h-11 bg-gray-50/50 border-gray-200 focus:bg-white text-base"
              placeholder="5.000"
              required
            />
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-1">
          <Label htmlFor="bio" className="text-gray-700">Bio Profile</Label>
          <Textarea 
            name="bio"
            value={formData.profile.bio}
            onChange={(e) => updateFormData('profile', 'bio', e.target.value)}
            placeholder="Ceritakan tentang dirimu"
            className="min-h-[100px] bg-gray-50/50 border-gray-200 focus:bg-white text-sm"
          />
        </div>
      </div>
    );
  };

  const renderVideoIntro = () => {
    return (
      <div className="space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-3 pb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Video Perkenalan
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Buat video perkenalan yang menarik untuk meningkatkan peluang Anda dipilih oleh brand
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Title and Help Link */}
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 rounded-lg">
                <Youtube className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">
                  Upload Video YouTube
                </h3>
                <p className="text-sm text-gray-500">Format landscape (16:9) • Durasi: 2-3 menit</p>
              </div>
            </div>
            <Link 
              href="/tutorial/video-guide" 
              target="_blank"
              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-all"
              title="Panduan Lengkap"
            >
              <HelpCircle className="w-5 h-5" />
            </Link>
          </div>

          {/* Instructions Card */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-50/50 border border-blue-100 
            rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-blue-800 font-medium">
              <Info className="w-4 h-4" />
              <span>Langkah-langkah Upload</span>
            </div>
            <ol className="space-y-2 text-sm text-blue-700 list-decimal list-inside pl-1">
              <li>Rekam video perkenalan dengan format landscape (16:9)</li>
              <li>Upload video ke YouTube sebagai "Unlisted"</li>
              <li>Klik tombol "SHARE" dan salin link video</li>
              <li>Paste link video pada form dibawah ini</li>
            </ol>
          </div>

          {/* Video Input and Preview */}
          <div className="space-y-4 bg-white rounded-xl border border-gray-200 p-4">
            <div className="relative">
              <Input
                id="video_url"
                name="video_url"
                value={formData.profile.video_url}
                onChange={(e) => updateFormData('profile', 'video_url', e.target.value)}
                placeholder="Contoh: https://youtube.com/watch?v=..."
                className="pl-10 h-12 border-gray-200 focus:border-blue-600 focus:ring-blue-600"
              />
              <Youtube className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            
            {formData.profile.video_url && (
              <div className="aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${getYouTubeVideoId(formData.profile.video_url)}`}
                  title="YouTube video preview"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            )}
          </div>

          {/* Tips Section */}
          <div className="flex items-start gap-3 p-4 bg-yellow-50/50 border border-yellow-100 rounded-xl">
            <div className="p-2 bg-yellow-100 rounded-lg shrink-0">
              <span className="text-xl">💡</span>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-yellow-800">Tips untuk Video yang Menarik:</p>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Gunakan pencahayaan yang baik</li>
                <li>• Pastikan suara jernih dan jelas</li>
                <li>• Tunjukkan kepribadian Anda</li>
                <li>• Tampilkan contoh cara Anda mempromosikan produk</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGallery = () => {
    return (
      <div className="space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-3 pb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Galeri Foto
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Tambahkan foto-foto terbaik Anda untuk menarik perhatian brand
          </p>
        </div>

        {/* Gallery Upload Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2">
            <div>
              <h3 className="font-medium text-gray-900">Upload Foto</h3>
              <p className="text-sm text-gray-500">
                Maksimal 5 foto • Format: JPG, PNG • Maks. 5MB per foto
              </p>
            </div>
            <div className="text-sm text-gray-500">
              {formData.profile.gallery.length}/5 foto
            </div>
          </div>

          {/* Upload Area */}
          {formData.profile.gallery.length < 5 && (
            <div 
              onClick={() => galleryInputRef.current?.click()}
              className="cursor-pointer group"
            >
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6
                hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-200">
                <div className="flex flex-col items-center">
                  <div className="p-3 rounded-full bg-blue-50 mb-3 group-hover:bg-blue-100 transition-colors">
                    <svg 
                      className="w-6 h-6 text-blue-600" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M12 4v16m8-8H4" 
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors">
                    Tambah Foto
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Klik untuk memilih foto
                  </p>
                </div>
              </div>
            </div>
          )}

          <input
            type="file"
            ref={galleryInputRef}
            className="hidden"
            accept="image/jpeg,image/png"
            multiple
            onChange={handleGalleryImageChange}
          />

          {/* Gallery Preview */}
          {formData.profile.gallery.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {formData.profile.gallery.map((item, index) => (
                <div key={index} className="relative aspect-square group">
                  <Image
                    src={item.preview}
                    alt={`Gallery photo ${index + 1}`}
                    fill
                    className="object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 
                    transition-opacity rounded-lg flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => removeGalleryPhoto(index)}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-full 
                        transition-colors text-white"
                    >
                      <svg 
                        className="w-5 h-5" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tips Section */}
          <div className="flex items-start gap-3 p-4 bg-yellow-50/50 border border-yellow-100 rounded-xl">
            <div className="p-2 bg-yellow-100 rounded-lg shrink-0">
              <span className="text-xl">💡</span>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-yellow-800">Tips untuk Foto Galeri:</p>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Gunakan foto dengan kualitas tinggi</li>
                <li>• Tunjukkan pengalaman live streaming Anda</li>
                <li>• Tampilkan interaksi dengan penonton</li>
                <li>• Pastikan pencahayaan yang baik</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPreview = () => {
    const previewStreamer: Streamer = {
      id: 0,
      user_id: '',
      first_name: formData.basicInfo.first_name,
      last_name: formData.basicInfo.last_name,
      platform: formData.profile.platforms[0],
      platforms: formData.profile.platforms,
      category: formData.profile.categories[0],
      categories: formData.profile.categories,
      rating: 0,
      price: parseInt(formData.profile.price.replace(/\./g, '')),
      image_url: imagePreview || '/images/default-avatar.png',
      bio: formData.profile.bio,
      location: formData.basicInfo.city,
      video_url: formData.profile.video_url,
      availableTimeSlots: [],
    };

    return (
      <div className="space-y-8">
        {/* Congratulations Message */}
        <div className="text-center space-y-3 mb-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Selamat! 🎉
          </h2>
          <p className="text-gray-600">
            Anda selangkah lagi menjadi host di platform kami. 
            Mari kita lihat bagaimana profil Anda akan tampil untuk client.
          </p>
        </div>

        {/* Card Preview Container with 3D effect */}
        <motion.div 
          className="relative w-full max-w-md mx-auto perspective-1000"
          initial={{ rotateX: 25, scale: 0.9 }}
          animate={{ 
            rotateX: 0, 
            scale: 1,
            transition: { duration: 0.6, ease: "easeOut" }
          }}
          whileHover={{ 
            scale: 1.02,
            rotateY: 5,
            transition: { duration: 0.2 }
          }}
        >
          {/* Glowing effect behind the card */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl rounded-3xl transform -translate-y-4"></div>
          
          {/* Card container with enhanced styling */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 transform hover:translate-y-[-2px] transition-transform duration-300">
            <StreamerCard streamer={previewStreamer} />
          </div>
        </motion.div>

        {/* Video Preview Section */}
        {formData.profile.video_url && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Video Perkenalan</h4>
            <div className="aspect-video rounded-xl overflow-hidden border border-gray-200">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${getYouTubeVideoId(formData.profile.video_url)}`}
                title="Introduction Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}

        {/* Gallery Preview Section */}
        {formData.profile.gallery.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Galeri Foto</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {formData.profile.gallery.map((item, index) => (
                <div key={index} className="relative aspect-square">
                  <Image
                    src={item.preview}
                    alt={`Gallery photo ${index + 1}`}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Information Section */}
        <div className="mt-12 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h4 className="font-semibold text-blue-700 mb-3">Informasi Tambahan</h4>
            <div className="text-sm text-blue-600 space-y-2">
              <p>Platform: {formData.profile.platforms.join(', ')}</p>
              <p>Kategori: {formData.profile.categories.join(', ')}</p>
              <p>Alamat: {formData.basicInfo.full_address}</p>
              <p>Jumlah Foto Galeri: {formData.profile.gallery.length}</p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <h4 className="font-semibold text-yellow-700 flex items-center gap-2 mb-3">
              <Info className="w-4 h-4" />
              Catatan Penting
            </h4>
            <ul className="text-sm text-yellow-600 space-y-2 list-disc list-inside">
              <li>Rating Anda akan dimulai dari 0 dan akan meningkat seiring dengan ulasan yang Anda terima</li>
              <li>Jadwal ketersediaan dapat diatur setelah pendaftaran</li>
              <li>Foto tambahan dapat ditambahkan ke galeri nanti</li>
            </ul>
          </div>

          {/* Terms and Conditions Checkbox */}
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
      </div>
    );
  };

  const removeGalleryPhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        gallery: prev.profile.gallery.filter((_, i) => i !== index)
      }
    }));
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
            <h1 className="text-2xl font-semibold bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
              Daftar sebagai Host
            </h1>
            <p className="mt-2 text-gray-600">
              Sudah punya akun?{" "}
              <Link href="/sign-in?type=streamer" className="text-red-600 hover:text-red-700 font-medium">
                Masuk disini
              </Link>
            </p>
          </div>

          {renderStepIndicator()}

          <form className="space-y-6">
            {currentStep === 1 && renderBasicInfo()}
            {currentStep === 2 && renderSecurity()}
            {currentStep === 3 && renderProfile()}
            {currentStep === 4 && renderVideoIntro()}
            {currentStep === 5 && renderGallery()}
            {currentStep === 6 && renderPreview()}

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
                  Previous
                </Button>
              )}
              
              <Button
                type="button"
                onClick={currentStep === 6 ? handleSignUp : handleNext}
                disabled={currentStep === 6 && !acceptedTerms}
                className={`flex-1 h-11 bg-gradient-to-r from-red-600 to-red-500 
                  ${currentStep === 6 && !acceptedTerms 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:from-red-700 hover:to-red-600'
                  } text-white`}
              >
                {currentStep === 6 ? (
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