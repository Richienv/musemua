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
import { Info } from 'lucide-react';

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

export default function StreamerSignUp({ searchParams }: { searchParams: Message }) {
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [price, setPrice] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

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

  const handleSignUp = async (formData: FormData) => {
    try {
      setError(null);
      setIsSigningUp(true);

      // Validate image
      const imageFile = formData.get('image') as File;
      const imageError = validateFile(imageFile, 'image');
      if (imageError) {
        setError(imageError);
        return;
      }

      // Add multiple platforms and categories to formData
      formData.delete('platforms'); // Remove any existing platforms
      selectedPlatforms.forEach(platform => {
        formData.append('platforms', platform);
      });

      formData.delete('categories'); // Remove any existing categories
      selectedCategories.forEach(category => {
        formData.append('categories', category);
      });

      // Validate gallery images
      const galleryFiles = formData.getAll('gallery') as File[];
      for (const file of galleryFiles) {
        const galleryError = validateFile(file, 'gallery');
        if (galleryError) {
          setError(galleryError);
          return;
        }
      }

      // Ensure price is properly formatted
      formData.set('price', price.replace(/\./g, ''));
      formData.set('video_url', videoUrl);

      const result = await streamerSignUpAction(formData);
      
      // If we get here, signup was successful
      window.location.href = '/sign-in?success=Account created successfully! Please sign in.';
    } catch (error: any) {
      console.error('Sign up error:', error);
      if (error.digest?.includes('NEXT_REDIRECT')) {
        const params = new URLSearchParams(error.digest.split(';')[2]);
        const errorMsg = params.get('error');
        setError(errorMsg || 'An unexpected error occurred');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
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
    if (files) {
      const newPreviews: string[] = [];
      const fileArray = Array.from(files).slice(0, 5); // Limit to 5 files

      fileArray.forEach((file, index) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews[index] = reader.result as string;
          if (newPreviews.filter(Boolean).length === fileArray.length) {
            setGalleryPreviews(newPreviews);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const formatPrice = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const formattedValue = formatPrice(rawValue);
    setPrice(formattedValue);
  };

  const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
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
              Daftar sebagai Streamer
            </h1>
            <p className="mt-2 text-gray-600">
              Sudah punya akun?{" "}
              <Link href="/sign-in?type=streamer" className="text-red-600 hover:text-red-700 font-medium">
                Masuk disini
              </Link>
            </p>
          </div>

          <form className="space-y-6">
            {/* Profile Image Upload */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-32 h-32 rounded-full overflow-hidden mb-3 border-2 border-gray-100 shadow-lg">
                {imagePreview ? (
                  <Image 
                    src={imagePreview} 
                    alt="Profile preview" 
                    width={128} 
                    height={128} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                    <span className="text-gray-400">Upload Photo</span>
                  </div>
                )}
              </div>
              <Label 
                htmlFor="image" 
                className="cursor-pointer text-red-600 hover:text-red-700 font-medium"
              >
                {imagePreview ? "Change Profile Photo" : "Upload Profile Photo"}
              </Label>
              <Input 
                id="image"
                name="image" 
                type="file" 
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                ref={fileInputRef}
                className="hidden"
                required
              />
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="first_name" className="text-gray-700">Nama Depan</Label>
                <Input 
                  name="first_name" 
                  placeholder="John" 
                  required 
                  className="h-11 bg-gray-50/50 border-gray-200 focus:bg-white text-base"
                  style={{ fontSize: '16px' }}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="last_name" className="text-gray-700">Nama Belakang</Label>
                <Input 
                  name="last_name" 
                  placeholder="Smith" 
                  required 
                  className="h-11 bg-gray-50/50 border-gray-200 focus:bg-white text-base"
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="email" className="text-gray-700">Alamat Email</Label>
              <Input 
                name="email" 
                type="email" 
                placeholder="nama@contoh.com" 
                required 
                className="h-11 bg-gray-50/50 border-gray-200 focus:bg-white text-base"
                style={{ fontSize: '16px' }}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-gray-700">Kata Sandi</Label>
              <Input 
                name="password" 
                type="password" 
                placeholder="Buat kata sandi" 
                required 
                className="h-11 bg-gray-50/50 border-gray-200 focus:bg-white text-base"
                style={{ fontSize: '16px' }}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirm_password" className="text-gray-700">Konfirmasi Kata Sandi</Label>
              <Input 
                name="confirm_password" 
                type="password" 
                placeholder="Konfirmasi kata sandi" 
                required 
                className="h-11 bg-gray-50/50 border-gray-200 focus:bg-white text-base"
                style={{ fontSize: '16px' }}
              />
            </div>

            {/* Platform and Category */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <Label htmlFor="platforms" className="text-gray-700 text-sm">Platform</Label>
                <div className="group relative">
                  <Info className="h-4 w-4 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs p-2 rounded-lg w-48">
                    Pilih platform yang Anda gunakan untuk live streaming
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {platforms.map((platform) => (
                  <div
                    key={platform}
                    onClick={() => {
                      setSelectedPlatforms(prev => 
                        prev.includes(platform)
                          ? prev.filter(p => p !== platform)
                          : [...prev, platform]
                      );
                    }}
                    className={`cursor-pointer p-2 rounded-lg border transition-all duration-200 text-sm ${
                      selectedPlatforms.includes(platform)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50/50'
                    }`}
                  >
                    {platform}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <Label htmlFor="categories" className="text-gray-700 text-sm">Kategori</Label>
                <div className="group relative">
                  <Info className="h-4 w-4 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs p-2 rounded-lg w-48">
                    Pilih kategori konten yang Anda buat
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <div
                    key={category}
                    onClick={() => {
                      setSelectedCategories(prev => 
                        prev.includes(category)
                          ? prev.filter(c => c !== category)
                          : [...prev, category]
                      );
                    }}
                    className={`cursor-pointer p-2 rounded-lg border transition-all duration-200 text-sm ${
                      selectedCategories.includes(category)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50/50'
                    }`}
                  >
                    {category}
                  </div>
                ))}
              </div>
            </div>

            {/* Location and Address */}
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-1">
                  <Label htmlFor="city" className="text-gray-700 text-sm">Kota</Label>
                  <div className="group relative">
                    <Info className="h-4 w-4 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs p-2 rounded-lg w-48">
                      Pilih kota tempat Anda akan melakukan live streaming
                    </div>
                  </div>
                </div>
                <Select name="city" required>
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
                <div className="flex items-center gap-2 mb-1">
                  <Label htmlFor="full_address" className="text-gray-700 text-sm">Alamat Lengkap</Label>
                  <div className="group relative">
                    <Info className="h-4 w-4 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs p-2 rounded-lg w-48">
                      Masukkan alamat lengkap Anda
                    </div>
                  </div>
                </div>
                <Textarea 
                  name="full_address" 
                  placeholder="Masukkan alamat lengkap Anda" 
                  required
                  className="min-h-[80px] bg-gray-50/50 border-gray-200 focus:bg-white text-sm"
                  style={{ fontSize: '14px' }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="price" className="text-gray-700">Harga (per jam)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rp.</span>
                <Input
                  name="price"
                  type="text"
                  inputMode="numeric"
                  value={price}
                  onChange={handlePriceChange}
                  className="pl-12 h-11 bg-gray-50/50 border-gray-200 focus:bg-white text-base"
                  style={{ fontSize: '16px' }}
                  placeholder="5.000"
                  required
                />
              </div>
            </div>

            {/* Biodata */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <Label htmlFor="bio" className="text-gray-700 text-sm">Bio Profile</Label>
                <div className="group relative">
                  <Info className="h-4 w-4 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs p-2 rounded-lg w-48">
                    Ceritakan keunikan dan keahlian khusus Anda sebagai host, serta pengalaman yang membuat Anda berbeda dari yang lain
                  </div>
                </div>
              </div>
              <Textarea 
                name="bio" 
                placeholder="Ceritakan tentang dirimu" 
                className="min-h-[100px] bg-gray-50/50 border-gray-200 focus:bg-white text-sm"
                style={{ fontSize: '14px' }}
              />
            </div>

            {/* Video Portfolio Section with enhanced description label */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <Label htmlFor="video_url" className="text-gray-700">Video Portfolio Host</Label>
                <div className="group relative">
                  <Info className="h-4 w-4 text-blue-400 cursor-help" />
                  <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs p-2 rounded-lg w-64 shadow-lg z-10">
                    Upload video hosting test Anda dengan durasi 1-2 menit sebagai portfolio untuk client
                  </div>
                </div>
              </div>
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md p-3 mb-2 shadow-md">
                Silakan upload video hosting test Anda dengan durasi 1-2 menit. Video ini akan menjadi portfolio Anda untuk ditampilkan kepada client.
              </div>
              <Input
                name="video_url"
                type="url"
                placeholder="https://youtu.be/..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="h-11 bg-gray-50/50 border-gray-200 focus:bg-white text-sm"
                style={{ fontSize: '14px' }}
              />
            </div>

            {videoUrl && getYouTubeVideoId(videoUrl) && (
              <div className="rounded-lg overflow-hidden shadow-sm">
                <iframe
                  width="100%"
                  height="200"
                  src={`https://www.youtube.com/embed/${getYouTubeVideoId(videoUrl)}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            )}

            {/* Gallery */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <Label htmlFor="gallery" className="text-gray-700 text-sm">Tambahan Foto Pendukung</Label>
                <div className="group relative">
                  <Info className="h-4 w-4 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs p-2 rounded-lg w-48">
                    Upload foto tambahan yang mendukung profil Anda (maksimal 5 foto)
                  </div>
                </div>
              </div>
              <Input
                id="gallery"
                name="gallery"
                type="file"
                accept="image/*"
                multiple
                onChange={handleGalleryImageChange}
                ref={galleryInputRef}
                className="h-11 bg-gray-50/50 border-gray-200 focus:bg-white text-sm"
                style={{ fontSize: '14px' }}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button 
              type="submit"
              onClick={(e) => {
                e.preventDefault();
                const form = e.currentTarget.closest('form');
                if (form) {
                  const formData = new FormData(form);
                  handleSignUp(formData);
                }
              }}
              disabled={isSigningUp}
              className="w-full h-11 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white transition-all duration-200"
            >
              {isSigningUp ? "Creating Account..." : "Create Streamer Account"}
            </Button>

            <FormMessage message={searchParams} />
          </form>
        </div>
      </div>
    </div>
  );
}