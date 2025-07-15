"use client";

import { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateUserProfile } from "@/app/actions";
import { createClient } from "@/utils/supabase/client";
import Image from 'next/image';
import { Loader2, User, Camera, MapPin, Upload, X, Plus, Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const MAX_GALLERY_PHOTOS = 10;

const locationOptions = [
  'Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Bali', 'Medan',
  'Semarang', 'Malang', 'Makassar', 'Palembang', 'Denpasar', 'Batam'
];

export default function MuseProfileEdit() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Profile state
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    location: '',
    bio: '',
    height: '',
    bust: '',
    waist: '',
    hips: '',
    hair_color: '',
    eye_color: '',
    dress_size: '',
    shoe_size: '',
    modeling_experience: '',
    available_for: [] as string[],
    instagram: '',
    portfolio_url: ''
  });

  // Image states
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  
  // Gallery states
  const [galleryPhotos, setGalleryPhotos] = useState<File[]>([]);
  const [existingGalleryUrls, setExistingGalleryUrls] = useState<string[]>([]);
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [imageError, setImageError] = useState('');
  const [galleryError, setGalleryError] = useState('');

  const availableForOptions = [
    'Fashion Photography', 'Commercial Photography', 'Editorial Shoots',
    'Beauty Campaigns', 'Fitness Photography', 'Lifestyle Photography',
    'Product Photography', 'Event Photography', 'Social Media Content',
    'Music Videos', 'Fashion Shows', 'Art Projects'
  ];

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
          height: userData.height || '',
          bust: userData.bust || '',
          waist: userData.waist || '',
          hips: userData.hips || '',
          hair_color: userData.hair_color || '',
          eye_color: userData.eye_color || '',
          dress_size: userData.dress_size || '',
          shoe_size: userData.shoe_size || '',
          modeling_experience: userData.modeling_experience || '',
          available_for: userData.available_for ? userData.available_for.split(',') : [],
          instagram: userData.instagram || '',
          portfolio_url: userData.portfolio_url || ''
        });

        if (userData.profile_picture_url) {
          setProfileImageUrl(userData.profile_picture_url);
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

  const handleAvailableForToggle = (option: string) => {
    setProfileData(prev => ({
      ...prev,
      available_for: prev.available_for.includes(option)
        ? prev.available_for.filter(s => s !== option)
        : [...prev.available_for, option]
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
      const formData = new FormData();
      
      // Add basic profile data
      Object.entries(profileData).forEach(([key, value]) => {
        if (key === 'available_for') {
          formData.append(key, (value as string[]).join(','));
        } else {
          formData.append(key, value as string);
        }
      });

      // Add profile image if selected
      if (profileImage) {
        formData.append('image', profileImage);
      }

      // Add gallery photos
      galleryPhotos.forEach((photo, index) => {
        formData.append(`gallery_${index}`, photo);
      });

      // Add existing gallery URLs to preserve them
      formData.append('existingGalleryPhotos', JSON.stringify(existingGalleryUrls));

      const result = await updateUserProfile(formData);
      
      if ('error' in result && result.error) {
        throw new Error(result.error);
      }

      toast.success('Profile updated successfully!');
      router.push('/protected');
      
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
            <Heart className="w-6 h-6 text-old-money-navy" />
            <h1 className="editorial-title text-old-money-navy">MUSE Profile</h1>
          </div>
          <p className="editorial-body text-old-money-charcoal">
            Showcase your talent and connect with professionals
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
                <Label className="editorial-caption text-old-money-navy">BIO</Label>
                <Textarea
                  value={profileData.bio}
                  onChange={(e) => updateProfileData('bio', e.target.value)}
                  placeholder="Tell us about yourself and your modeling experience..."
                  className="border-old-money-sage focus:border-old-money-navy bg-white min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Physical Characteristics */}
          <Card className="bg-white border-old-money-pearl">
            <CardHeader>
              <CardTitle className="editorial-subtitle text-old-money-navy">Physical Characteristics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="editorial-caption text-old-money-navy">HEIGHT (CM)</Label>
                  <Input
                    value={profileData.height}
                    onChange={(e) => updateProfileData('height', e.target.value)}
                    placeholder="170"
                    className="border-old-money-sage focus:border-old-money-navy bg-white"
                  />
                </div>
                <div>
                  <Label className="editorial-caption text-old-money-navy">BUST (CM)</Label>
                  <Input
                    value={profileData.bust}
                    onChange={(e) => updateProfileData('bust', e.target.value)}
                    placeholder="86"
                    className="border-old-money-sage focus:border-old-money-navy bg-white"
                  />
                </div>
                <div>
                  <Label className="editorial-caption text-old-money-navy">WAIST (CM)</Label>
                  <Input
                    value={profileData.waist}
                    onChange={(e) => updateProfileData('waist', e.target.value)}
                    placeholder="66"
                    className="border-old-money-sage focus:border-old-money-navy bg-white"
                  />
                </div>
                <div>
                  <Label className="editorial-caption text-old-money-navy">HIPS (CM)</Label>
                  <Input
                    value={profileData.hips}
                    onChange={(e) => updateProfileData('hips', e.target.value)}
                    placeholder="90"
                    className="border-old-money-sage focus:border-old-money-navy bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="editorial-caption text-old-money-navy">HAIR COLOR</Label>
                  <Select value={profileData.hair_color} onValueChange={(value) => updateProfileData('hair_color', value)}>
                    <SelectTrigger className="border-old-money-sage focus:border-old-money-navy bg-white">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="black">Black</SelectItem>
                      <SelectItem value="brown">Brown</SelectItem>
                      <SelectItem value="blonde">Blonde</SelectItem>
                      <SelectItem value="red">Red</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="editorial-caption text-old-money-navy">EYE COLOR</Label>
                  <Select value={profileData.eye_color} onValueChange={(value) => updateProfileData('eye_color', value)}>
                    <SelectTrigger className="border-old-money-sage focus:border-old-money-navy bg-white">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brown">Brown</SelectItem>
                      <SelectItem value="black">Black</SelectItem>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                      <SelectItem value="hazel">Hazel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="editorial-caption text-old-money-navy">DRESS SIZE</Label>
                  <Input
                    value={profileData.dress_size}
                    onChange={(e) => updateProfileData('dress_size', e.target.value)}
                    placeholder="S, M, L"
                    className="border-old-money-sage focus:border-old-money-navy bg-white"
                  />
                </div>
                <div>
                  <Label className="editorial-caption text-old-money-navy">SHOE SIZE</Label>
                  <Input
                    value={profileData.shoe_size}
                    onChange={(e) => updateProfileData('shoe_size', e.target.value)}
                    placeholder="37, 38, 39"
                    className="border-old-money-sage focus:border-old-money-navy bg-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Modeling Experience */}
          <Card className="bg-white border-old-money-pearl">
            <CardHeader>
              <CardTitle className="editorial-subtitle text-old-money-navy">Modeling Experience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="editorial-caption text-old-money-navy">EXPERIENCE LEVEL</Label>
                <Select value={profileData.modeling_experience} onValueChange={(value) => updateProfileData('modeling_experience', value)}>
                  <SelectTrigger className="border-old-money-sage focus:border-old-money-navy bg-white">
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner (0-1 years)</SelectItem>
                    <SelectItem value="intermediate">Intermediate (2-5 years)</SelectItem>
                    <SelectItem value="experienced">Experienced (5+ years)</SelectItem>
                    <SelectItem value="professional">Professional (10+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="editorial-caption text-old-money-navy">AVAILABLE FOR</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                  {availableForOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleAvailableForToggle(option)}
                      className={`p-3 rounded-sm text-sm transition-all duration-300 ${
                        profileData.available_for.includes(option)
                          ? 'bg-old-money-navy text-old-money-ivory'
                          : 'bg-old-money-pearl text-old-money-navy hover:bg-old-money-sage'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
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
                Showcase your best photos (Max {MAX_GALLERY_PHOTOS} photos)
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