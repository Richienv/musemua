"use client";

import { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateUserProfile } from "@/app/actions";
import { createClient } from "@/utils/supabase/client";
import Image from 'next/image';
import { Loader2, User, Mail, Camera, MapPin, Upload, X, Plus, Palette } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const MAX_GALLERY_PHOTOS = 8;

const locationOptions = [
  'Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Bali', 'Medan',
  'Semarang', 'Malang', 'Makassar', 'Palembang', 'Denpasar', 'Batam'
];

const specialtyOptions = [
  'Bridal Makeup', 'Editorial Makeup', 'Fashion Makeup', 'Special Effects',
  'Theatrical Makeup', 'Beauty Makeup', 'Commercial Makeup', 'Fantasy Makeup',
  'Airbrush Makeup', 'Traditional Makeup'
];

export default function MuaProfileEdit() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const showcaseInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Profile state
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    location: '',
    bio: '',
    tagline: '',
    specialties: [] as string[],
    years_experience: '',
    certifications: '',
    price_range: '',
    instagram: '',
    portfolio_url: ''
  });

  // Image states
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  
  // Showcase image states
  const [showcaseImage, setShowcaseImage] = useState<File | null>(null);
  const [showcaseImageUrl, setShowcaseImageUrl] = useState<string>('');
  const [showcasePreviewUrl, setShowcasePreviewUrl] = useState<string>('');
  
  // Gallery states
  const [galleryPhotos, setGalleryPhotos] = useState<File[]>([]);
  const [existingGalleryUrls, setExistingGalleryUrls] = useState<string[]>([]);
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [imageError, setImageError] = useState('');
  const [galleryError, setGalleryError] = useState('');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        router.push('/sign-in');
        return;
      }

      // Fetch user profile
      const { data: userData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        toast.error('Failed to load profile');
        return;
      }

      if (userData) {
        setProfileData({
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          email: userData.email || '',
          location: userData.location || '',
          bio: userData.bio || '',
          tagline: userData.tagline || '',
          specialties: userData.specialties ? userData.specialties.split(',') : [],
          years_experience: userData.years_experience?.toString() || '',
          certifications: userData.certifications || '',
          price_range: userData.price_range || '',
          instagram: userData.instagram || '',
          portfolio_url: userData.portfolio_url || ''
        });

        if (userData.image_url) {
          setProfileImageUrl(userData.image_url);
        }
        
        // For now, showcase image can be stored in a custom field or use the same profile image
        // You can add a showcase_image_url field to your database later
        if (userData.showcase_image_url) {
          setShowcaseImageUrl(userData.showcase_image_url);
        }
      }

      // Fetch existing gallery photos if any
      const { data: galleryData } = await supabase
        .from('portfolio_images')
        .select('image_url')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (galleryData) {
        setExistingGalleryUrls(galleryData.map(item => item.image_url));
      }

    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const updateProfileData = (field: string, value: string | string[]) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSpecialtyToggle = (specialty: string) => {
    setProfileData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setImageError('Image size exceeds 1MB. Please choose a smaller image.');
        return;
      }

      setProfileImage(file);
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
      setImageError('');
    }
  };

  const handleShowcaseImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setImageError('Image size exceeds 1MB. Please choose a smaller image.');
        return;
      }

      setShowcaseImage(file);
      const preview = URL.createObjectURL(file);
      setShowcasePreviewUrl(preview);
      setImageError('');
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const totalExisting = existingGalleryUrls.length + galleryPhotos.length;
      const remainingSlots = MAX_GALLERY_PHOTOS - totalExisting;
      
      if (remainingSlots <= 0) {
        setGalleryError(`Maximum ${MAX_GALLERY_PHOTOS} photos allowed`);
        return;
      }

      const newPhotos = Array.from(files).slice(0, remainingSlots);
      setGalleryPhotos(prev => [...prev, ...newPhotos]);
      setGalleryError('');
    }
  };

  const removeGalleryPhoto = (index: number) => {
    setGalleryPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingPhoto = (index: number) => {
    setExistingGalleryUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('🚀 Starting form submission...');
      console.log('Profile image:', profileImage);
      console.log('Gallery photos count:', galleryPhotos.length);
      console.log('Existing gallery URLs:', existingGalleryUrls);

      const formData = new FormData();
      
      // Add basic profile data
      Object.entries(profileData).forEach(([key, value]) => {
        if (key === 'specialties') {
          formData.append(key, (value as string[]).join(','));
        } else {
          formData.append(key, value as string);
        }
      });

      // Add profile image if selected
      if (profileImage) {
        console.log('📸 Adding profile image to FormData:', {
          name: profileImage.name,
          size: profileImage.size,
          type: profileImage.type
        });
        formData.append('image', profileImage);
      }

      // Add showcase image if selected
      if (showcaseImage) {
        console.log('🌟 Adding showcase image to FormData:', {
          name: showcaseImage.name,
          size: showcaseImage.size,
          type: showcaseImage.type
        });
        formData.append('showcase_image', showcaseImage);
      }

      // Add gallery photos
      galleryPhotos.forEach((photo, index) => {
        console.log(`🖼️ Adding gallery photo ${index}:`, {
          name: photo.name,
          size: photo.size,
          type: photo.type
        });
        formData.append(`gallery_${index}`, photo);
      });

      // Add existing gallery URLs to preserve them
      formData.append('existingGalleryPhotos', JSON.stringify(existingGalleryUrls));

      // Log all FormData entries
      console.log('📋 FormData contents:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}:`, { name: value.name, size: value.size, type: value.type });
        } else {
          console.log(`${key}:`, value);
        }
      }

      console.log('📤 Calling updateUserProfile...');
      const result = await updateUserProfile(formData);
      
      console.log('📥 Update result:', result);
      
      if ('error' in result && result.error) {
        console.error('❌ Server error:', result.error);
        throw new Error(result.error);
      }

      if (result.success) {
        console.log('✅ Profile updated successfully!');
        toast.success('Profile updated successfully!');
        router.push('/protected');
      } else {
        console.error('❌ Update failed - no success flag');
        throw new Error('Update failed without specific error');
      }
      
    } catch (error) {
      console.error('💥 Client error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Failed to update profile: ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-old-money-ivory flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-old-money-navy" />
          <p className="editorial-caption text-old-money-stone">LOADING PROFILE...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-old-money-ivory py-12 px-6">
      <Toaster position="top-right" />
      
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Palette className="w-6 h-6 text-old-money-navy" />
            <h1 className="editorial-title text-old-money-navy">MUA Profile</h1>
          </div>
          <p className="editorial-body text-old-money-charcoal">
            Create your professional makeup artist profile
          </p>
          <div className="w-16 h-px bg-old-money-sage mx-auto mt-4"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Profile Picture */}
          <Card className="bg-white border-old-money-pearl">
            <CardHeader>
              <CardTitle className="editorial-subtitle text-old-money-navy">Profile Picture</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-32 h-32 rounded-full border-2 border-old-money-sage cursor-pointer hover:border-old-money-navy transition-colors group"
                >
                  {previewUrl || profileImageUrl ? (
                    <Image
                      src={previewUrl || profileImageUrl}
                      alt="Profile"
                      fill
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-old-money-cream flex items-center justify-center">
                      <Camera className="w-8 h-8 text-old-money-stone group-hover:text-old-money-navy transition-colors" />
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-full bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                  className="hidden"
                />
                
                <p className="editorial-caption text-old-money-stone text-center">
                  CLICK TO UPLOAD PROFILE PICTURE<br />
                  (Max 1MB)
                </p>
                
                {imageError && (
                  <p className="text-red-600 text-sm">{imageError}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Showcase Image */}
          <Card className="bg-white border-old-money-pearl">
            <CardHeader>
              <CardTitle className="editorial-subtitle text-old-money-navy">Showcase Image</CardTitle>
              <p className="editorial-caption text-old-money-stone">
                Upload your most proud work to be displayed prominently on your profile
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <div 
                  onClick={() => showcaseInputRef.current?.click()}
                  className="relative w-64 h-48 rounded-lg border-2 border-old-money-sage cursor-pointer hover:border-old-money-navy transition-colors group"
                >
                  {showcasePreviewUrl || showcaseImageUrl ? (
                    <Image
                      src={showcasePreviewUrl || showcaseImageUrl}
                      alt="Showcase work"
                      fill
                      className="rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-lg bg-old-money-cream flex items-center justify-center">
                      <Camera className="w-12 h-12 text-old-money-stone group-hover:text-old-money-navy transition-colors" />
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-lg bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                <input
                  ref={showcaseInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleShowcaseImageChange}
                  className="hidden"
                />
                
                <p className="editorial-caption text-old-money-stone text-center">
                  CLICK TO UPLOAD YOUR BEST WORK<br />
                  (Max 1MB)
                </p>
                
                {imageError && (
                  <p className="text-red-600 text-sm">{imageError}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card className="bg-white border-old-money-pearl">
            <CardHeader>
              <CardTitle className="editorial-subtitle text-old-money-navy">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="editorial-caption text-old-money-navy">FIRST NAME</Label>
                  <Input
                    value={profileData.first_name}
                    onChange={(e) => updateProfileData('first_name', e.target.value)}
                    className="border-old-money-sage focus:border-old-money-navy bg-white"
                    required
                  />
                </div>
                <div>
                  <Label className="editorial-caption text-old-money-navy">LAST NAME</Label>
                  <Input
                    value={profileData.last_name}
                    onChange={(e) => updateProfileData('last_name', e.target.value)}
                    className="border-old-money-sage focus:border-old-money-navy bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <Label className="editorial-caption text-old-money-navy">EMAIL</Label>
                <Input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="border-old-money-sage bg-old-money-pearl text-old-money-stone"
                />
              </div>

              <div>
                <Label className="editorial-caption text-old-money-navy">LOCATION</Label>
                <Select value={profileData.location} onValueChange={(value) => updateProfileData('location', value)}>
                  <SelectTrigger className="border-old-money-sage focus:border-old-money-navy bg-white">
                    <SelectValue placeholder="Select your city" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationOptions.map((location) => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="editorial-caption text-old-money-navy">PROFESSIONAL TAGLINE</Label>
                <Input
                  value={profileData.tagline}
                  onChange={(e) => updateProfileData('tagline', e.target.value)}
                  placeholder="e.g., Luxury Bridal Makeup Specialist"
                  className="border-old-money-sage focus:border-old-money-navy bg-white"
                />
              </div>

              <div>
                <Label className="editorial-caption text-old-money-navy">BIO</Label>
                <Textarea
                  value={profileData.bio}
                  onChange={(e) => updateProfileData('bio', e.target.value)}
                  placeholder="Tell us about your experience and style..."
                  className="border-old-money-sage focus:border-old-money-navy bg-white min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Professional Details */}
          <Card className="bg-white border-old-money-pearl">
            <CardHeader>
              <CardTitle className="editorial-subtitle text-old-money-navy">Professional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="editorial-caption text-old-money-navy">SPECIALTIES</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                  {specialtyOptions.map((specialty) => (
                    <button
                      key={specialty}
                      type="button"
                      onClick={() => handleSpecialtyToggle(specialty)}
                      className={`p-3 rounded-sm text-sm transition-all duration-300 ${
                        profileData.specialties.includes(specialty)
                          ? 'bg-old-money-navy text-old-money-ivory'
                          : 'bg-old-money-pearl text-old-money-navy hover:bg-old-money-sage'
                      }`}
                    >
                      {specialty}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="editorial-caption text-old-money-navy">YEARS OF EXPERIENCE</Label>
                  <Select value={profileData.years_experience} onValueChange={(value) => updateProfileData('years_experience', value)}>
                    <SelectTrigger className="border-old-money-sage focus:border-old-money-navy bg-white">
                      <SelectValue placeholder="Select experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-1">0-1 years</SelectItem>
                      <SelectItem value="2-5">2-5 years</SelectItem>
                      <SelectItem value="6-10">6-10 years</SelectItem>
                      <SelectItem value="10+">10+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="editorial-caption text-old-money-navy">PRICE RANGE</Label>
                  <Select value={profileData.price_range} onValueChange={(value) => updateProfileData('price_range', value)}>
                    <SelectTrigger className="border-old-money-sage focus:border-old-money-navy bg-white">
                      <SelectValue placeholder="Select price range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="budget">Budget (Under 500k)</SelectItem>
                      <SelectItem value="mid">Mid-range (500k - 2M)</SelectItem>
                      <SelectItem value="premium">Premium (2M - 5M)</SelectItem>
                      <SelectItem value="luxury">Luxury (5M+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="editorial-caption text-old-money-navy">CERTIFICATIONS</Label>
                <Textarea
                  value={profileData.certifications}
                  onChange={(e) => updateProfileData('certifications', e.target.value)}
                  placeholder="List your makeup certifications, courses, and training..."
                  className="border-old-money-sage focus:border-old-money-navy bg-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="editorial-caption text-old-money-navy">INSTAGRAM</Label>
                  <Input
                    value={profileData.instagram}
                    onChange={(e) => updateProfileData('instagram', e.target.value)}
                    placeholder="@yourusername"
                    className="border-old-money-sage focus:border-old-money-navy bg-white"
                  />
                </div>

                <div>
                  <Label className="editorial-caption text-old-money-navy">PORTFOLIO URL</Label>
                  <Input
                    value={profileData.portfolio_url}
                    onChange={(e) => updateProfileData('portfolio_url', e.target.value)}
                    placeholder="https://yourportfolio.com"
                    className="border-old-money-sage focus:border-old-money-navy bg-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Gallery */}
          <Card className="bg-white border-old-money-pearl">
            <CardHeader>
              <CardTitle className="editorial-subtitle text-old-money-navy">Portfolio Gallery</CardTitle>
              <p className="editorial-caption text-old-money-stone">
                Showcase your best work (Max {MAX_GALLERY_PHOTOS} photos)
              </p>
            </CardHeader>
            <CardContent>
              {/* Existing Photos */}
              {existingGalleryUrls.length > 0 && (
                <div className="mb-6">
                  <h4 className="editorial-caption text-old-money-navy mb-3">CURRENT PORTFOLIO</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {existingGalleryUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <Image
                          src={url}
                          alt={`Portfolio ${index + 1}`}
                          width={200}
                          height={200}
                          className="w-full h-32 object-cover rounded-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingPhoto(index)}
                          className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Photos */}
              {galleryPhotos.length > 0 && (
                <div className="mb-6">
                  <h4 className="editorial-caption text-old-money-navy mb-3">NEW PHOTOS</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {galleryPhotos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <Image
                          src={URL.createObjectURL(photo)}
                          alt={`New photo ${index + 1}`}
                          width={200}
                          height={200}
                          className="w-full h-32 object-cover rounded-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeGalleryPhoto(index)}
                          className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <div className="text-center">
                <Button
                  type="button"
                  variant="luxury-outline"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={existingGalleryUrls.length + galleryPhotos.length >= MAX_GALLERY_PHOTOS}
                  className="border-old-money-navy text-old-money-navy hover:bg-old-money-navy hover:text-old-money-ivory"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  ADD PORTFOLIO PHOTOS
                </Button>
                
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryChange}
                  className="hidden"
                />
                
                {galleryError && (
                  <p className="text-red-600 text-sm mt-2">{galleryError}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-center pt-8">
            <Button
              type="submit"
              disabled={isLoading}
              variant="luxury"
              size="luxury-lg"
              className="bg-old-money-navy hover:bg-old-money-charcoal text-old-money-ivory"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  UPDATING PROFILE...
                </>
              ) : (
                'UPDATE PROFILE'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}