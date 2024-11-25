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

const platforms = ["TikTok", "Shopee"];
const categories = ["Fashion", "Technology", "Beauty", "Gaming", "Cooking", "Fitness", "Music", "Others"];
const indonesiaCities = ["Jakarta", "Surabaya", "Bandung", "Medan", "Semarang", "Makassar", "Palembang", "Tangerang"];

export default function StreamerSignUp({ searchParams }: { searchParams: Message }) {
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [price, setPrice] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleSignUp = async (formData: FormData) => {
    setIsSigningUp(true);
    formData.set('price', price.replace(/\./g, ''));
    formData.set('video_url', videoUrl);
    await streamerSignUpAction(formData);
    setIsSigningUp(false);
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
    <div className="h-screen w-full flex">
      {/* Left Section */}
      <section className="hidden lg:block w-[60%] xl:w-[65%] relative">
        <div className="absolute inset-0 bg-black/10" />
        <Image
          src="/images/login.png"
          alt="Login background"
          fill
          className="object-cover"
          priority
          quality={100}
        />
        <div className="absolute top-16 left-16">
          <Image
            src="/images/salda.png"
            alt="Salda Logo"
            width={120}
            height={120}
            className="brightness-0 invert"
          />
        </div>
      </section>

      {/* Right Section */}
      <section className="w-full lg:w-[40%] xl:w-[35%] bg-white">
        <div className="h-full flex flex-col px-8 lg:px-16 py-8 overflow-y-auto">
          <div className="lg:hidden mb-8">
            <Image
              src="/images/salda.png"
              alt="Salda Logo"
              width={90}
              height={90}
            />
          </div>

          <div className="w-full">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
                Daftar sebagai Streamer
              </h1>
              <p className="text-gray-600 mt-2">
                Sudah punya akun?{" "}
                <Link href="/sign-in" className="text-red-600 hover:text-red-700 font-medium">
                  Masuk disini
                </Link>
              </p>
            </div>

            <form className="space-y-6">
              {/* Profile Image Upload */}
              <div className="flex flex-col items-center mb-8">
                <div className="w-32 h-32 rounded-full overflow-hidden mb-3 border-2 border-gray-100 shadow-lg">
                  {imagePreview ? (
                    <Image src={imagePreview} alt="Pratinjau profil" width={128} height={128} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-50" />
                  )}
                </div>
                <Label htmlFor="image" className="cursor-pointer text-red-600 hover:text-red-700 font-medium">
                  {imagePreview ? "Ganti Foto Profil" : "Unggah Foto Profil"}
                </Label>
                <Input 
                  id="image"
                  name="image" 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange}
                  ref={fileInputRef}
                  className="hidden"
                />
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="first_name" className="text-gray-700">Nama Depan</Label>
                  <Input 
                    name="first_name" 
                    placeholder="Masukkan nama depan" 
                    required 
                    className="h-11 bg-gray-50 border-gray-200 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="last_name" className="text-gray-700">Nama Belakang</Label>
                  <Input 
                    name="last_name" 
                    placeholder="Masukkan nama belakang" 
                    required 
                    className="h-11 bg-gray-50 border-gray-200 focus:bg-white"
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
                  className="h-11 bg-gray-50 border-gray-200 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="password" className="text-gray-700">Kata Sandi</Label>
                <Input 
                  name="password" 
                  type="password" 
                  placeholder="Buat kata sandi" 
                  required 
                  className="h-11 bg-gray-50 border-gray-200 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirm_password" className="text-gray-700">Konfirmasi Kata Sandi</Label>
                <Input 
                  name="confirm_password" 
                  type="password" 
                  placeholder="Konfirmasi kata sandi" 
                  required 
                  className="h-11 bg-gray-50 border-gray-200 focus:bg-white"
                />
              </div>

              {/* Platform and Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="platform" className="text-gray-700">Platform</Label>
                  <Select name="platform">
                    <SelectTrigger className="h-11 bg-gray-50 border-gray-200 focus:bg-white">
                      <SelectValue placeholder="Pilih platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {platforms.map((platform) => (
                        <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="category" className="text-gray-700">Kategori</Label>
                  <Select name="category">
                    <SelectTrigger className="h-11 bg-gray-50 border-gray-200 focus:bg-white">
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Location and Price */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="location" className="text-gray-700">Lokasi</Label>
                  <Select name="location">
                    <SelectTrigger className="h-11 bg-gray-50 border-gray-200 focus:bg-white">
                      <SelectValue placeholder="Pilih kota" />
                    </SelectTrigger>
                    <SelectContent>
                      {indonesiaCities.map((city) => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      className="pl-12 h-11 bg-gray-50 border-gray-200 focus:bg-white"
                      placeholder="5.000"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1">
                <Label htmlFor="bio" className="text-gray-700">Biodata</Label>
                <Textarea 
                  name="bio" 
                  placeholder="Ceritakan tentang dirimu" 
                  className="min-h-[100px] bg-gray-50 border-gray-200 focus:bg-white"
                />
              </div>

              {/* Video URL */}
              <div className="space-y-1">
                <Label htmlFor="video_url" className="text-gray-700">URL Video YouTube</Label>
                <Input
                  name="video_url"
                  type="url"
                  placeholder="https://youtu.be/..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="h-11 bg-gray-50 border-gray-200 focus:bg-white"
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
              <div className="space-y-2">
                <Label htmlFor="gallery" className="text-gray-700">Foto Galeri (Maks 5)</Label>
                <Input
                  id="gallery"
                  name="gallery"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryImageChange}
                  ref={galleryInputRef}
                  className="h-11 bg-gray-50 border-gray-200 focus:bg-white"
                />
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {galleryPreviews.map((preview, index) => (
                    preview && (
                      <div key={index} className="relative rounded-lg overflow-hidden shadow-sm">
                        <Image
                          src={preview}
                          alt={`Gallery preview ${index + 1}`}
                          width={100}
                          height={100}
                          className="w-full h-24 object-cover"
                        />
                      </div>
                    )
                  ))}
                </div>
              </div>

              <Button 
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget.closest('form');
                  if (form) handleSignUp(new FormData(form));
                }}
                disabled={isSigningUp}
                className="w-full h-11 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white transition-all duration-200"
              >
                {isSigningUp ? "Membuat Akun..." : "Buat Akun Streamer"}
              </Button>

              <FormMessage message={searchParams} />
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}