"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateUserProfile, updateStreamerProfile } from "@/app/actions";
import { createClient } from "@/utils/supabase/client";
import Image from 'next/image';
import { Loader2, User, Mail, FileText, Camera, Youtube, AlertCircle, ChevronLeft, Upload, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';

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

// Create a separate component for the settings content
function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type');
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
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (streamerError) {
          console.error('Error fetching streamer data:', streamerError);
          return;
        }

        if (streamerData) {
          // Update streamer form fields
          setPlatform(streamerData.platform || '');
          setFirstName(streamerData.first_name || '');
          setLastName(streamerData.last_name || '');
          setLocation(streamerData.location || '');
          setYoutubeVideoUrl(streamerData.video_url || '');
          setImageUrl(streamerData.image_url || '');
          setBio(streamerData.bio || '');
          
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
      
      if (type === 'streamer') {
        formData.append('youtubeVideoUrl', youtubeVideoUrl);
        formData.append('platform', platform);
        
        console.log('New gallery photos to upload:', newGalleryPhotos); // Debug log
        
        // Add gallery photos
        newGalleryPhotos.forEach((photo) => {
          formData.append('gallery', photo);
        });
        
        // Add existing gallery photos
        formData.append('existingGalleryPhotos', JSON.stringify(galleryPhotos));
      }

      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const result = type === 'streamer' 
        ? await updateStreamerProfile(formData)
        : await updateUserProfile(formData);

      if ('error' in result && result.error) {
        toast.error(result.error);
        return;
      }

      // Use type guard to safely access the correct property
      const newImageUrl = isStreamerResponse(result) 
        ? result.imageUrl 
        : (result as UserProfileResponse).profilePictureUrl;

      if (newImageUrl) {
        setImageUrl(newImageUrl);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setSelectedImage(null);
      }

      toast.success('Profile successfully updated');
      await fetchUserData();

    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
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

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Toaster position="top-center" />
      <div className="flex items-center mb-6">
        <Button 
          onClick={handleBackNavigation} 
          variant="outline" 
          size="sm" 
          className="mr-4 border-blue-600 text-blue-600 hover:bg-blue-50"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <h1 className="text-xl sm:text-2xl font-semibold">
          {type === 'streamer' ? 'Pengaturan Streamer' : 'Pengaturan Client'}
        </h1>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50">
          <CardTitle className="text-lg sm:text-xl font-semibold">Informasi Profil</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col items-center mb-6">
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 mb-2">
                  {(previewUrl || imageUrl) ? (
                    <Image
                      src={previewUrl || imageUrl || ''}
                      alt="Profile"
                      width={128}
                      height={128}
                      className="w-full h-full rounded-full object-cover border-4 border-blue-100"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-50 rounded-full flex items-center justify-center border-4 border-blue-100">
                      <User className="h-12 w-12 text-blue-300" />
                    </div>
                  )}
                </div>
                <Button 
                  type="button" 
                  onClick={handleImageClick} 
                  className="mt-2 bg-gradient-to-r from-[#1e40af] to-[#6b21a8] hover:from-[#1e3a8a] hover:to-[#581c87] text-white"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {imageUrl ? 'Change Image' : 'Upload Image'}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                  accept="image/*"
                />
                {imageError && (
                  <p className="text-red-500 text-xs mt-2 flex items-center">
                    <AlertCircle className="mr-1 h-4 w-4" />
                    {imageError}
                  </p>
                )}
              </div>

              <div className="grid gap-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="flex items-center text-sm text-gray-600">
                      <User className="mr-2 h-4 w-4 text-blue-600" />
                      Nama Depan
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="mt-1 border-gray-200 focus:border-blue-600 focus:ring-blue-600"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Nama depan saat ini: {firstName || 'Belum diatur'}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="flex items-center text-sm text-gray-600">
                      <User className="mr-2 h-4 w-4 text-blue-600" />
                      Nama Belakang
                    </Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="mt-1 border-gray-200 focus:border-blue-600 focus:ring-blue-600"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Nama belakang saat ini: {lastName || 'Belum diatur'}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="location" className="flex items-center text-sm text-gray-600">
                    <MapPin className="mr-2 h-4 w-4 text-blue-600" />
                    Lokasi
                  </Label>
                  <Input
                    id="location"
                    name="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="mt-1 border-gray-200 focus:border-blue-600 focus:ring-blue-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Lokasi saat ini: {location || 'Belum diatur'}
                  </p>
                </div>

                {/* Brand Guidelines - Only show for clients */}
                {type !== 'streamer' && (
                  <div className="space-y-1">
                    <Label htmlFor="brand_guideline" className="flex items-center text-sm text-gray-600">
                      <FileText className="mr-2 h-4 w-4 text-blue-600" />
                      Brand Guideline
                    </Label>
                    <div className="relative">
                      <Input
                        type="file"
                        id="brand_guideline"
                        name="brand_guideline"
                        onChange={handleBrandGuidelineChange}
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                      />
                      <div 
                        onClick={() => document.getElementById('brand_guideline')?.click()}
                        className="cursor-pointer group flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50/50"
                      >
                        <div className="text-center">
                          <Upload className="mx-auto h-8 w-8 text-gray-400 group-hover:text-blue-500 mb-2 transition-colors" />
                          <span className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors">
                            {newBrandGuideline ? newBrandGuideline.name : 'Klik untuk memperbarui Brand Guidelines'}
                          </span>
                          {brandGuidelineUrl && (
                            <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                              <p className="font-medium text-sm text-blue-600">Brand Guideline Saat Ini:</p>
                              <p className="text-sm text-blue-500 truncate">
                                {brandGuidelineUrl.split('/').pop()}
                              </p>
                            </div>
                          )}
                          {!brandGuidelineUrl && (
                            <p className="text-xs text-gray-500 mt-1">
                              Belum ada file yang diunggah
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    {brandGuidelineError && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {brandGuidelineError}
                      </p>
                    )}
                  </div>
                )}

                {/* Streamer-specific fields */}
                {type === 'streamer' && (
                  <>
                    <div className="space-y-1">
                      <Label htmlFor="youtubeVideoUrl" className="flex items-center text-sm text-gray-600">
                        <Youtube className="mr-2 h-4 w-4 text-blue-600" />
                        Video YouTube
                      </Label>
                      <Input
                        id="youtubeVideoUrl"
                        name="youtubeVideoUrl"
                        value={youtubeVideoUrl}
                        onChange={(e) => setYoutubeVideoUrl(e.target.value)}
                        placeholder="https://youtube.com/watch?v=..."
                        className="mt-1 border-gray-200 focus:border-blue-600 focus:ring-blue-600"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {youtubeVideoUrl ? 
                          `Video saat ini: ${youtubeVideoUrl}` : 
                          'Tambahkan video untuk menunjukkan gaya streaming Anda'
                        }
                      </p>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="galleryPhotos" className="flex items-center text-sm text-gray-600">
                        <Camera className="mr-2 h-4 w-4 text-blue-600" />
                        Foto Galeri (Maks. 5)
                      </Label>
                      <Input
                        type="file"
                        id="galleryPhotos"
                        onChange={handleGalleryPhotoChange}
                        accept="image/*"
                        multiple
                        className="mt-1"
                        disabled={galleryPhotos.length + newGalleryPhotos.length >= maxGalleryPhotos}
                      />
                      {galleryError && (
                        <p className="text-red-500 text-xs mt-1">{galleryError}</p>
                      )}
                      
                      <div className="grid grid-cols-5 gap-2 mt-2">
                        {galleryPhotos.map((photo, index) => (
                          <div key={index} className="relative">
                            <Image
                              src={photo}
                              alt={`Gallery photo ${index + 1}`}
                              width={100}
                              height={100}
                              className="w-full h-24 object-cover rounded"
                            />
                            <button
                              type="button"
                              onClick={() => removeGalleryPhoto(index)}
                              className="absolute top-0 right-0 bg-gradient-to-r from-[#1e40af] to-[#6b21a8] text-white rounded-full p-1"
                            >
                              X
                            </button>
                          </div>
                        ))}
                        {newGalleryPhotos.map((photo, index) => (
                          <div key={`new-${index}`} className="relative">
                            <Image
                              src={URL.createObjectURL(photo)}
                              alt={`New gallery photo ${index + 1}`}
                              width={100}
                              height={100}
                              className="w-full h-24 object-cover rounded"
                            />
                            <button
                              type="button"
                              onClick={() => removeGalleryPhoto(index, true)}
                              className="absolute top-0 right-0 bg-gradient-to-r from-[#1e40af] to-[#6b21a8] text-white rounded-full p-1"
                            >
                              X
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-[#1e40af] to-[#6b21a8] hover:from-[#1e3a8a] hover:to-[#581c87] text-white h-11"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
