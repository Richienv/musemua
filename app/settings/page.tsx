"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateUserProfile, updateStreamerProfile, updateStreamerPrice } from "@/app/actions";
import { createClient } from "@/utils/supabase/client";
import Image from 'next/image';
import { Loader2, User, Mail, FileText, Camera, Youtube, AlertCircle, ChevronLeft, Upload, MapPin, AlertTriangle, DollarSign, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB in bytes

// First, let's define the response types at the top of the file
interface BaseResponse {
  success: boolean;
  error?: string;
}

interface StreamerProfileResponse extends BaseResponse {
  imageUrl?: string;
}

interface UserProfileResponse extends BaseResponse {
  profilePictureUrl?: string;
}

// Update the type guard to handle error cases
function isStreamerResponse(
  response: StreamerProfileResponse | UserProfileResponse | { error: string }
): response is StreamerProfileResponse {
  return 'success' in response && !('profilePictureUrl' in response);
}

// Update the type for the updateUserProfile function response
type UpdateProfileResponse = {
  success: boolean;
  error?: string;
  imageUrl?: string;
  profilePictureUrl?: string;
};

// First, add proper interfaces for the data types
interface StreamerProfile {
  first_name: string;
  last_name: string;
  profile_picture_url: string | null;
  location: string;
  platform: string;
  category: string;
  price: number;
  video_url: string | null;
  bio: string | null;
  gallery_photos: string[];
  image_url: string | null;
}

interface UserProfile {
  first_name: string;
  last_name: string;
  profile_picture_url: string | null;
  location: string;
  brand_guidelines_url: string | null;
}

// Add these interfaces at the top of the file
interface StreamerData {
  first_name: string;
  last_name: string;
  profile_picture_url: string | null;
  location: string;
  platform: string;
  category: string;
  price: number;
  video_url: string | null;
  bio: string | null;
  gallery_photos: string[];
  image_url: string | null;
}

interface UserData {
  first_name: string;
  last_name: string;
  profile_picture_url: string | null;
  location: string;
  brand_guidelines_url: string | null;
}

// Add these interfaces to your existing interfaces
interface PriceUpdateResponse {
  success: boolean;
  message?: string;
  current_price: number;
  previous_price: number | null;
  discount_percentage: number | null;
}

// First, add this interface for the streamer data that includes the id
interface StreamerWithId extends StreamerData {
  id: number;
}

// Add this interface for the price limits
interface PriceLimits {
  minPrice: number;
  maxPrice: number;
}

// Add this interface at the top of the file
interface PriceUpdateResult {
  success: boolean;
  message?: string;
  error?: string;
  current_price: number;
  previous_price: number | null;
  discount_percentage: number | null;
}

// Create a separate component for the settings content
function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams?.get('type') || 'client';
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState('');
  const [userType, setUserType] = useState<'streamer' | 'client' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [newGalleryPhotos, setNewGalleryPhotos] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false); // New state for loading
  const [location, setLocation] = useState("");
  const [newBrandGuideline, setNewBrandGuideline] = useState<File | null>(null);
  const [brandGuidelineUrl, setBrandGuidelineUrl] = useState("");
  const [brandGuidelineError, setBrandGuidelineError] = useState("");
  const [youtubeVideoUrl, setYoutubeVideoUrl] = useState('');
  const [galleryError, setGalleryError] = useState('');
  const maxGalleryPhotos = 5;
  const [platform, setPlatform] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [lastPriceUpdate, setLastPriceUpdate] = useState<string | null>(null);
  const [nextAvailableUpdate, setNextAvailableUpdate] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string>('');
  const [newPrice, setNewPrice] = useState<string>('');
  const [streamerId, setStreamerId] = useState<number | null>(null);
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState<number | null>(null);
  const [brandName, setBrandName] = useState('');

  // Move fetchUserData outside of useEffect
  const fetchUserData = async () => {
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error('Authentication error:', authError);
        router.push('/sign-in');
        return;
      }

      // First, get the user type
      const { data: userTypeData, error: userTypeError } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', user.id)
        .single();

      if (userTypeError) {
        console.error('Error fetching user type:', userTypeError);
        return;
      }

      setUserType(userTypeData.user_type);

      // If user is a streamer and type param is streamer, fetch streamer data
      if (userTypeData.user_type === 'streamer' && type === 'streamer') {
        const { data: streamerData, error: streamerError } = await supabase
          .from('streamers')
          .select(`
            id,
            *,
            streamer_price_history (
              previous_price,
              new_price,
              effective_from
            )
          `)
          .eq('user_id', user.id)
          .single();

        if (streamerError) {
          console.error('Error fetching streamer data:', streamerError);
          return;
        }

        if (streamerData) {
          setStreamerId(streamerData.id);
          setPrice(streamerData.price);
          
          // Get current discount info
          const { data: discountData } = await supabase
            .from('streamer_current_discounts')
            .select('*')
            .eq('streamer_id', streamerData.id)
            .single();

          if (discountData) {
            setPreviousPrice(discountData.previous_price);
            setDiscountPercentage(discountData.discount_percentage);
          }
          
          // Update streamer form fields
          setPlatform(streamerData.platform || '');
          setFirstName(streamerData.first_name || '');
          setLastName(streamerData.last_name || '');
          setLocation(streamerData.location || '');
          setYoutubeVideoUrl(streamerData.video_url || '');
          setImageUrl(streamerData.image_url || '');
          setBio(streamerData.bio || '');
          setLastPriceUpdate(streamerData.last_price_update);

          // Calculate next available update time if last_price_update exists
          if (streamerData.last_price_update) {
            const nextUpdate = new Date(streamerData.last_price_update);
            nextUpdate.setHours(nextUpdate.getHours() + 24);
            setNextAvailableUpdate(nextUpdate.toISOString());
          }

          // Fetch gallery photos
          const { data: galleryData } = await supabase
            .from('streamer_gallery_photos')
            .select('photo_url')
            .eq('streamer_id', streamerData.id)
            .order('order_number');

          setGalleryPhotos(galleryData?.map(item => item.photo_url) || []);
        }
      } else {
        // Regular user data fetch for clients
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select(`
            first_name,
            last_name,
            profile_picture_url,
            location,
            brand_name,
            brand_guidelines_url
          `)
          .eq('id', user.id)
          .single();

        if (userError) {
          console.error('Error fetching user data:', userError);
          toast.error('Failed to fetch user data');
          return;
        }

        if (userData) {
          setFirstName(userData.first_name || '');
          setLastName(userData.last_name || '');
          setLocation(userData.location || '');
          setBrandName(userData.brand_name || '');
          setBrandGuidelineUrl(userData.brand_guidelines_url || '');
          setImageUrl(userData.profile_picture_url || '');
        }
      }
    } catch (error) {
      console.error('Error in fetchUserData:', error);
      toast.error('Failed to fetch profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [router, type]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('location', location);

      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      if (type === 'streamer') {
        // Handle streamer-specific updates
        formData.append('platform', platform);
        formData.append('youtubeVideoUrl', youtubeVideoUrl);
        
        newGalleryPhotos.forEach((photo) => {
          formData.append('gallery', photo);
        });
        
        formData.append('existingGalleryPhotos', JSON.stringify(galleryPhotos));

        // Update price if changed
        if (price) {
          await handlePriceUpdate(price);
        }

        const result = await updateStreamerProfile(formData);
        if ('error' in result && result.error) {
          throw new Error(result.error);
        }
      } else {
        // Handle client-specific updates
        formData.append('brandName', brandName);
        if (newBrandGuideline) {
          formData.append('brandGuidelines', newBrandGuideline);
        }

        const result = await updateUserProfile(formData);
        if ('error' in result && result.error) {
          throw new Error(result.error);
        }
      }

      toast.success('Profile berhasil diupdate');
      await fetchUserData();

    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Gagal mengupdate profile: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setImageError('Image size exceeds 1MB. Please choose a smaller image.');
        return;
      }

      // Just set the File directly, no need for Blob conversion
      setSelectedImage(file);
      // Create preview URL
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
      setImageError('');
    }
  };

  const handleGalleryPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const remainingSlots = maxGalleryPhotos - (galleryPhotos.length + newGalleryPhotos.length);
      if (remainingSlots <= 0) {
        setGalleryError(`Maximum ${maxGalleryPhotos} photos allowed`);
        return;
      }

      const newPhotos = Array.from(files).slice(0, remainingSlots);
      setNewGalleryPhotos(prev => [...prev, ...newPhotos]);
      setGalleryError('');
    }
  };

  const removeGalleryPhoto = (index: number, isNew: boolean = false) => {
    if (isNew) {
      setNewGalleryPhotos(prev => prev.filter((_, i) => i !== index));
    } else {
      setGalleryPhotos(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleBackNavigation = () => {
    if (userType === 'streamer') {
      router.push('/streamer-dashboard');
    } else {
      router.push('/protected');
    }
  };

  const handleBrandGuidelineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setBrandGuidelineError('File size should not exceed 5MB');
        return;
      }
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setBrandGuidelineError('Only PDF and DOC/DOCX files are allowed');
        return;
      }
      setNewBrandGuideline(file);
      setBrandGuidelineError('');
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow numbers
    setNewPrice(value);
    setPriceError('');
  };

  const handlePriceUpdate = async (currentPrice?: number) => {
    if (!newPrice || !streamerId) {
      setPriceError('Please enter a valid price');
      return;
    }

    try {
      const result = await updateStreamerPrice(streamerId, Number(newPrice)) as PriceUpdateResult;
      
      if (result.success) {
        // Update state without showing toast
        setPrice(result.current_price);
        setPreviousPrice(result.previous_price);
        setDiscountPercentage(result.discount_percentage);
        setLastPriceUpdate(new Date().toISOString());
        setNewPrice('');
        await fetchUserData();
      } else {
        setPriceError(result.error || 'Failed to update price');
      }
    } catch (error) {
      console.error('Error updating price:', error);
      setPriceError('Failed to update price');
    }
  };

  // Add this near your other utility functions
  const calculatePriceWithPlatformFee = (basePrice: number): number => {
    const platformFeePercentage = 30;
    return basePrice * (1 + platformFeePercentage / 100);
  };

  // Update the price error messages
  const getPriceErrorMessage = (errorMessage: string) => {
    switch (errorMessage) {
      case 'Price can only be updated once every 24 hours':
        return 'Kamu hanya bisa update harga sekali dalam 24 jam';
      case 'Price change cannot exceed 25%':
        return 'Perubahan harga tidak boleh lebih dari 25%';
      default:
        return errorMessage;
    }
  };

  // Add this function to help debug price updates
  const debugPriceHistory = async (streamerId: number): Promise<void> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('streamer_price_history')
      .select('*')
      .eq('streamer_id', streamerId)
      .order('created_at', { ascending: false });

    console.log('Price History:', data, 'Error:', error);
  };

  // Update the calculatePriceLimits function
  const calculatePriceLimits = (currentPrice: number): PriceLimits => {
    const minPrice = Math.ceil(currentPrice * 0.75); // Maximum 25% reduction
    const maxPrice = Math.ceil(currentPrice * 1.25); // Maximum 25% increase
    return { minPrice, maxPrice };
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Toaster position="top-center" />
      <div className="flex items-center mb-8">
        <Button 
          onClick={handleBackNavigation} 
          variant="outline" 
          size="sm" 
          className="mr-4 border-blue-600 text-blue-600 hover:bg-blue-50"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
          {type === 'streamer' ? 'Pengaturan Streamer' : 'Pengaturan Client'}
        </h1>
      </div>

      <Card className="border-0 shadow-lg bg-[#faf9f6]">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-[#faf9f6] py-8">
          <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-900">Informasi Profil</CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          {loading ? (
            <div className="flex justify-center items-center h-[60vh]">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="flex flex-col items-center mb-10">
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 mb-4">
                  {(previewUrl || imageUrl) ? (
                    <Image
                      src={previewUrl || imageUrl || ''}
                      alt="Profile"
                      width={160}
                      height={160}
                      className="w-full h-full rounded-full object-cover border-4 border-blue-100"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-50 rounded-full flex items-center justify-center border-4 border-blue-100">
                      <User className="h-16 w-16 text-blue-400" />
                    </div>
                  )}
                </div>
                <Button 
                  type="button" 
                  onClick={handleImageClick} 
                  className="mt-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {imageUrl ? 'Ganti Foto Profil' : 'Upload Foto Profil'}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                  accept="image/*"
                />
                {imageError && (
                  <p className="text-red-500 text-sm mt-2 flex items-center">
                    <AlertCircle className="mr-1 h-4 w-4" />
                    {imageError}
                  </p>
                )}
              </div>

              {/* Show price settings only for streamers */}
              {type === 'streamer' && (
                <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-8 mb-8 border border-gray-100">
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                      <DollarSign className="h-5 w-5 text-[#E23744]" />
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">Tarif Dasar Kamu</h3>
                    </div>

                    <div className="relative">
                      <Input
                        id="price"
                        type="text"
                        value={newPrice}
                        onChange={handlePriceChange}
                        placeholder={price ? price.toString() : "Masukkan harga baru"}
                        className="pl-8 h-11 text-base sm:text-lg border-gray-200 focus:border-[#E23744] focus:ring-[#E23744]"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-base sm:text-lg">
                        Rp
                      </span>
                    </div>
                    
                    <p className="text-xs sm:text-sm text-gray-600">
                      Contoh: Ketik "50000" untuk harga Rp 50.000
                    </p>

                    {/* Price guidance message */}
                    {price > 0 && (
                      <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-100 space-y-2 sm:space-y-3">
                        <p className="text-sm sm:text-base font-medium text-gray-900">Batas perubahan harga:</p>
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                          <div className="bg-[#E23744]/5 rounded-lg p-3 sm:p-4">
                            <p className="text-xs sm:text-sm text-gray-600">Minimum</p>
                            <p className="text-sm sm:text-base font-semibold text-gray-900">
                              Rp {calculatePriceLimits(price).minPrice.toLocaleString('id-ID')}
                            </p>
                          </div>
                          <div className="bg-[#E23744]/5 rounded-lg p-3 sm:p-4">
                            <p className="text-xs sm:text-sm text-gray-600">Maximum</p>
                            <p className="text-sm sm:text-base font-semibold text-gray-900">
                              Rp {calculatePriceLimits(price).maxPrice.toLocaleString('id-ID')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Display final price with platform fee */}
                    <div className="bg-[#E23744]/5 rounded-xl p-4 sm:p-6 border border-[#E23744]/10">
                      <p className="text-sm sm:text-base font-medium text-gray-900 mb-1 sm:mb-2">
                        Harga Yang Dilihat Client:
                      </p>
                      <p className="text-lg sm:text-xl font-bold text-[#E23744]">
                        Rp {Math.round(calculatePriceWithPlatformFee(price)).toLocaleString('id-ID')} / jam
                      </p>
                    </div>
                    
                    {priceError && (
                      <div className="flex items-start gap-2 p-3 sm:p-4 bg-red-50 rounded-xl border border-red-100">
                        <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-red-800">Error:</p>
                          <p className="text-xs sm:text-sm text-red-700">{getPriceErrorMessage(priceError)}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-2 p-4 sm:p-5 bg-gray-50 rounded-xl border border-gray-100">
                      <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-900">Perhatian:</p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Untuk menjaga kestabilan platform, perubahan harga dibatasi maksimal 25% naik atau turun per hari. Harga yang dilihat client akan otomatis ditambah 30% sebagai biaya layanan platform.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-8">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="firstName" className="flex items-center text-base sm:text-lg font-medium text-gray-900">
                      <User className="mr-2 h-5 w-5 text-blue-600" />
                      Nama Depan
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="h-11 text-base sm:text-lg border-gray-200 focus:border-blue-600 focus:ring-blue-600 bg-white"
                    />
                    <p className="text-xs sm:text-sm text-gray-600">
                      Nama depan saat ini: {firstName || 'Belum diatur'}
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="lastName" className="flex items-center text-base sm:text-lg font-medium text-gray-900">
                      <User className="mr-2 h-5 w-5 text-blue-600" />
                      Nama Belakang
                    </Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="h-11 text-base sm:text-lg border-gray-200 focus:border-blue-600 focus:ring-blue-600 bg-white"
                    />
                    <p className="text-xs sm:text-sm text-gray-600">
                      Nama belakang saat ini: {lastName || 'Belum diatur'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="location" className="flex items-center text-base sm:text-lg font-medium text-gray-900">
                    <MapPin className="mr-2 h-5 w-5 text-blue-600" />
                    Lokasi
                  </Label>
                  <Input
                    id="location"
                    name="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="h-11 text-base sm:text-lg border-gray-200 focus:border-blue-600 focus:ring-blue-600 bg-white"
                  />
                  <p className="text-xs sm:text-sm text-gray-600">
                    Lokasi saat ini: {location || 'Belum diatur'}
                  </p>
                </div>

                {/* Client-specific fields */}
                {type === 'client' && (
                  <>
                    <div className="space-y-3">
                      <Label htmlFor="brandName" className="flex items-center text-base sm:text-lg font-medium text-gray-900">
                        <FileText className="mr-2 h-5 w-5 text-blue-600" />
                        Nama Brand
                      </Label>
                      <Input
                        id="brandName"
                        name="brandName"
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        className="h-11 text-base sm:text-lg border-gray-200 focus:border-blue-600 focus:ring-blue-600 bg-white"
                      />
                      <p className="text-xs sm:text-sm text-gray-600">
                        Nama brand saat ini: {brandName || 'Belum diatur'}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="brandGuidelines" className="flex items-center text-base sm:text-lg font-medium text-gray-900">
                        <FileText className="mr-2 h-5 w-5 text-blue-600" />
                        Brand Guidelines
                      </Label>
                      <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <Input
                          type="file"
                          id="brandGuidelines"
                          onChange={handleBrandGuidelineChange}
                          accept=".pdf,.doc,.docx"
                          className="h-11 text-base sm:text-lg border-gray-200 focus:border-blue-600 focus:ring-blue-600"
                        />
                        {brandGuidelineUrl && (
                          <p className="text-xs sm:text-sm text-gray-600 mt-3">
                            Brand guidelines saat ini:{' '}
                            <a 
                              href={brandGuidelineUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 hover:underline"
                            >
                              Lihat dokumen
                            </a>
                          </p>
                        )}
                        {brandGuidelineError && (
                          <p className="text-red-500 text-sm mt-2">{brandGuidelineError}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Streamer-specific fields */}
                {type === 'streamer' && (
                  <>
                    <div className="space-y-3">
                      <Label htmlFor="youtubeVideoUrl" className="flex items-center text-base sm:text-lg font-medium text-gray-900">
                        <Youtube className="mr-2 h-5 w-5 text-[#E23744]" />
                        Video YouTube
                      </Label>
                      <Input
                        id="youtubeVideoUrl"
                        name="youtubeVideoUrl"
                        value={youtubeVideoUrl}
                        onChange={(e) => setYoutubeVideoUrl(e.target.value)}
                        placeholder="https://youtube.com/watch?v=..."
                        className="h-11 text-base sm:text-lg border-gray-200 focus:border-[#E23744] focus:ring-[#E23744]"
                      />
                      <p className="text-xs sm:text-sm text-gray-600">
                        {youtubeVideoUrl ? 
                          `Video saat ini: ${youtubeVideoUrl}` : 
                          'Tambahkan video untuk menunjukkan gaya streaming Anda'
                        }
                      </p>
                    </div>

                    <div className="space-y-4">
                      <Label htmlFor="galleryPhotos" className="flex items-center text-base sm:text-lg font-medium text-gray-900">
                        <Camera className="mr-2 h-5 w-5 text-[#E23744]" />
                        Foto Galeri (Maks. 5)
                      </Label>
                      
                      <div className="bg-[#E23744]/5 rounded-xl p-6 border border-[#E23744]/10">
                        <Input
                          type="file"
                          id="galleryPhotos"
                          onChange={handleGalleryPhotoChange}
                          accept="image/*"
                          multiple
                          className="mb-4 text-base"
                          disabled={galleryPhotos.length + newGalleryPhotos.length >= maxGalleryPhotos}
                        />
                        {galleryError && (
                          <p className="text-red-500 text-sm mb-4">{galleryError}</p>
                        )}
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                          {galleryPhotos.map((photo, index) => (
                            <div key={index} className="relative aspect-square">
                              <Image
                                src={photo}
                                alt={`Gallery photo ${index + 1}`}
                                width={200}
                                height={200}
                                className="w-full h-full object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => removeGalleryPhoto(index)}
                                className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                              >
                                <XCircle className="h-5 w-5 text-red-500" />
                              </button>
                            </div>
                          ))}
                          {newGalleryPhotos.map((photo, index) => (
                            <div key={`new-${index}`} className="relative aspect-square">
                              <Image
                                src={URL.createObjectURL(photo)}
                                alt={`New gallery photo ${index + 1}`}
                                width={200}
                                height={200}
                                className="w-full h-full object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => removeGalleryPhoto(index, true)}
                                className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                              >
                                <XCircle className="h-5 w-5 text-red-500" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <Button 
                  type="submit" 
                  className={`w-full h-14 text-white text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 ${
                    type === 'client' 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                      : 'bg-gradient-to-r from-[#E23744] to-[#E23744]/90 hover:from-[#E23744]/90 hover:to-[#E23744]'
                  }`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Menyimpan Perubahan...
                    </>
                  ) : (
                    'Simpan Perubahan'
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Main component that wraps the content in Suspense
export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
