"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { SignUpResponse } from "@/app/types/auth";
import { format } from 'date-fns';
import { createNotification, createStreamNotifications, createItemReceivedNotification, type NotificationType } from '@/services/notification-service';

// Add this helper function at the top of the file
function sanitizeFileName(fileName: string): string {
  // Remove special characters and spaces, replace with underscores
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\s+/g, '_')
    .toLowerCase();
}

export interface StreamerProfileResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export async function signUpAction(formData: FormData): Promise<SignUpResponse> {
  const supabase = createClient();
  
  try {
    // Get basic info
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const firstName = formData.get("first_name") as string;
    const lastName = formData.get("last_name") as string;
    const location = formData.get("location") as string;
    
    // Get brand info
    const brandName = formData.get("brand_name") as string;
    const brandDescription = formData.get("brand_description") as string;
    const brandGuidelineFile = formData.get("brand_doc") as File;

    // 1. Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return {
        success: false,
        error: 'Email already registered'
      };
    }

    // 2. Create the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          user_type: 'client',
          brand_name: brandName,
          location: location,
        }
      },
    });

    if (authError || !authData.user) {
      return {
        success: false,
        error: authError?.message || 'Failed to create user'
      };
    }

    // 3. Upload brand guidelines if provided
    let brandGuidelineUrl = null;
    if (brandGuidelineFile && brandGuidelineFile.size > 0) {
      const fileName = `${authData.user.id}/${Date.now()}_${sanitizeFileName(brandGuidelineFile.name)}`;

      const { error: uploadError, data } = await supabase.storage
        .from('brand_guideline')
        .upload(fileName, brandGuidelineFile);

      if (uploadError) {
        await supabase.auth.admin.deleteUser(authData.user.id);
        return {
          success: false,
          error: 'Failed to upload brand guideline'
        };
      }

      brandGuidelineUrl = supabase.storage
        .from('brand_guideline')
        .getPublicUrl(fileName).data.publicUrl;
    }

    // 4. Create user profile
    const { error: profileError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        first_name: firstName,
        last_name: lastName,
        user_type: 'client',
        brand_name: brandName,
        brand_description: brandDescription,
        brand_guidelines_url: brandGuidelineUrl,
        location: location,
        image_url: null,
        bio: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      // Clean up: delete user and uploaded file if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return {
        success: false,
        error: 'Failed to create user profile'
      };
    }

    // Return success response with direct redirect to protected page
    return {
      success: true,
      redirectTo: '/protected'
    };
    
  } catch (error) {
    console.error('Sign up error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred"
    };
  }
}

export async function signUpMuaAction(formData: FormData): Promise<SignUpResponse> {
  const supabase = createClient();
  
  try {
    // Get basic info only
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const firstName = formData.get("first_name") as string;
    const lastName = formData.get("last_name") as string;
    const location = formData.get("location") as string;

    // 1. Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return {
        success: false,
        error: 'Email already registered'
      };
    }

    // 2. Create the user with Supabase Auth with email confirmation
    console.log('Attempting MUA signup for email:', email);
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          user_type: 'mua',
          location: location,
        }
      },
    });

    console.log('MUA Signup result:', { 
      success: !authError, 
      user: authData.user?.id,
      email: authData.user?.email,
      emailConfirmed: authData.user?.email_confirmed_at,
      error: authError?.message 
    });

    if (authError) {
      console.error('MUA signup error:', authError);
      return {
        success: false,
        error: authError?.message || 'Failed to create user'
      };
    }

    // 3. For email confirmation flow, we don't create the profile here
    // The profile will be created in the auth callback after email verification
    
    // Return success response with redirect to email verification page
    return {
      success: true,
      redirectTo: '/email-verification',
      message: 'Please check your email to verify your account'
    };
    
  } catch (error) {
    console.error('MUA sign up error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred"
    };
  }
}

export async function signUpMuseAction(formData: FormData): Promise<SignUpResponse> {
  const supabase = createClient();
  
  try {
    // Get basic info only
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const firstName = formData.get("first_name") as string;
    const lastName = formData.get("last_name") as string;
    const location = formData.get("location") as string;

    // 1. Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return {
        success: false,
        error: 'Email already registered'
      };
    }

    // 2. Create the user with Supabase Auth with email confirmation
    console.log('Attempting MUSE signup for email:', email);
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          user_type: 'muse',
          location: location,
        }
      },
    });

    console.log('MUSE Signup result:', { 
      success: !authError, 
      user: authData.user?.id,
      email: authData.user?.email,
      emailConfirmed: authData.user?.email_confirmed_at,
      error: authError?.message 
    });

    if (authError) {
      console.error('MUSE signup error:', authError);
      return {
        success: false,
        error: authError?.message || 'Failed to create user'
      };
    }

    // 3. For email confirmation flow, we don't create the profile here
    // The profile will be created in the auth callback after email verification
    
    // Return success response with redirect to email verification page
    return {
      success: true,
      redirectTo: '/email-verification',
      message: 'Please check your email to verify your account'
    };
    
  } catch (error) {
    console.error('MUSE sign up error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred"
    };
  }
}

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", `Sign-in failed: ${error.message}`);
  }

  if (!data.user) {
    return encodedRedirect("error", "/sign-in", "Sign-in failed: No user data returned");
  }

  // Check if email is confirmed for MUA and MUSE users
  if (!data.user.email_confirmed_at) {
    // Check if this is a MUA or MUSE user from metadata
    const userType = data.user.user_metadata?.user_type;
    if (['mua', 'muse'].includes(userType)) {
      await supabase.auth.signOut();
      return encodedRedirect("error", "/sign-in", "Please verify your email before signing in. Check your email for the verification link.");
    }
  }

  // Verify user type is 'muse', 'mua', or 'client'
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('user_type')
    .eq('id', data.user.id)
    .single();

  if (userError || !userData) {
    console.error('User lookup error:', { userError, userId: data.user.id, email: data.user.email });
    
    // If user doesn't exist in users table, try to create from auth metadata
    if (userError?.code === 'PGRST116') { // No rows returned
      const userMetadata = data.user.user_metadata;
      const userType = userMetadata?.user_type || 'client';
      
      const profileData: any = {
        id: data.user.id,
        auth_user_id: data.user.id,
        email: data.user.email,
        first_name: userMetadata?.first_name || '',
        last_name: userMetadata?.last_name || '',
        display_name: `${userMetadata?.first_name || ''} ${userMetadata?.last_name || ''}`.trim(),
        user_type: userType,
        status: 'offline',
        location: userMetadata?.location || null,
        clients_reached: 0,
        projects_completed: 0,
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // Add type-specific fields
      // Note: Additional type-specific fields will be filled out via profile editing
      
      const { error: createError } = await supabase
        .from('users')
        .insert(profileData);
        
      if (createError) {
        console.error('Error creating user profile during sign-in:', createError);
        await supabase.auth.signOut();
        return encodedRedirect("error", "/sign-in", "Error creating user profile");
      }
      
      // Continue with the created profile
      // No need to fetch again, we know the user_type
    } else {
      await supabase.auth.signOut();
      return encodedRedirect("error", "/sign-in", "Error verifying user type");
    }
  }

  // Allow MUSE, MUA, and client users to access the platform
  const finalUserType = userData?.user_type || data.user.user_metadata?.user_type || 'client';
  if (!['muse', 'mua', 'client'].includes(finalUserType)) {
    await supabase.auth.signOut();
    return encodedRedirect("error", "/sign-in", "Invalid user type");
  }

  return redirect("/protected");
};

export const signInAsStreamerAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  // Verify user type is 'streamer'
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('user_type')
    .eq('id', data.user.id)
    .single();

  if (userError || !userData) {
    await supabase.auth.signOut();
    return encodedRedirect("error", "/sign-in", "Error verifying user type");
  }

  if (userData.user_type !== 'streamer') {
    await supabase.auth.signOut();
    return encodedRedirect("error", "/sign-in", "Please use the client login page if you're a client");
  }

  return redirect("/streamer-dashboard");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = createClient();
  const origin = headers().get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password update failed",
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

export const resendVerificationEmailAction = async (email: string) => {
  const supabase = createClient();
  
  try {
    console.log('Resending verification email for:', email);
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    if (error) {
      console.error('Resend verification error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    console.log('Verification email resent successfully for:', email);
    return {
      success: true,
      message: 'Verification email sent successfully'
    };
  } catch (error) {
    console.error('Resend verification error:', error);
    return {
      success: false,
      error: 'Failed to resend verification email'
    };
  }
};

export async function checkUsernameAvailability(username: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("users")
    .select("username")
    .eq("username", username)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Username check error:", error);
    return { available: false, error: "Error checking username" };
  }

  return { available: !data, error: null };
}

export async function updateUserProfile(formData: FormData) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { error: 'Not authenticated' };
    }

    // Support both old and new field names for backward compatibility
    const firstName = formData.get('first_name') || formData.get('firstName') as string;
    const lastName = formData.get('last_name') || formData.get('lastName') as string;
    const location = formData.get('location') as string;
    const bio = formData.get('bio') as string;
    const image = formData.get('image') as File;

    // MUA-specific fields
    const tagline = formData.get('tagline') as string;
    const specialties = formData.get('specialties') as string;
    const yearsExperience = formData.get('years_experience') as string;
    const certifications = formData.get('certifications') as string;
    const priceRange = formData.get('price_range') as string;
    const instagram = formData.get('instagram') as string;
    const portfolioUrl = formData.get('portfolio_url') as string;

    // MUSE-specific fields
    const height = formData.get('height') as string;
    const bust = formData.get('bust') as string;
    const waist = formData.get('waist') as string;
    const hips = formData.get('hips') as string;
    const hairColor = formData.get('hair_color') as string;
    const eyeColor = formData.get('eye_color') as string;
    const dressSize = formData.get('dress_size') as string;
    const shoeSize = formData.get('shoe_size') as string;
    const modelingExperience = formData.get('modeling_experience') as string;
    const availableFor = formData.get('available_for') as string;

    // First update the users table
    const updateData: any = {
      first_name: firstName,
      last_name: lastName,
      location: location,
      bio: bio,
      updated_at: new Date().toISOString(),
    };

    // Add MUA-specific fields if provided
    if (tagline) updateData.tagline = tagline;
    if (specialties) updateData.specialties = specialties;
    if (yearsExperience) updateData.years_experience = yearsExperience;
    if (certifications) updateData.certifications = certifications;
    if (priceRange) updateData.price_range = priceRange;
    if (instagram) updateData.instagram = instagram;
    if (portfolioUrl) updateData.portfolio_url = portfolioUrl;

    // Add MUSE-specific fields if provided
    if (height) updateData.height = height;
    if (bust) updateData.bust = bust;
    if (waist) updateData.waist = waist;
    if (hips) updateData.hips = hips;
    if (hairColor) updateData.hair_color = hairColor;
    if (eyeColor) updateData.eye_color = eyeColor;
    if (dressSize) updateData.dress_size = dressSize;
    if (shoeSize) updateData.shoe_size = shoeSize;
    if (modelingExperience) updateData.modeling_experience = modelingExperience;
    if (availableFor) updateData.available_for = availableFor;

    // Handle profile picture upload if present
    if (image && image.size > 0) {
      console.log('Uploading profile image:', {
        name: image.name,
        size: image.size,
        type: image.type
      });

      const fileExt = image.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}/profile/${uuidv4()}.${fileExt}`;

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('userprofile')
        .upload(fileName, image, {
          cacheControl: '3600',
          upsert: true,
          contentType: image.type
        });

      if (uploadError) {
        console.error('Profile image upload error:', uploadError);
        return { error: `Failed to upload profile image: ${uploadError.message}` };
      }

      const { data: { publicUrl } } = supabase.storage
        .from('userprofile')
        .getPublicUrl(fileName);

      updateData.image_url = publicUrl;
      console.log('Profile image uploaded successfully:', publicUrl);
    }

    // Handle showcase image upload if present
    const showcaseImage = formData.get('showcase_image') as File;
    if (showcaseImage && showcaseImage.size > 0) {
      console.log('Uploading showcase image:', {
        name: showcaseImage.name,
        size: showcaseImage.size,
        type: showcaseImage.type
      });

      const fileExt = showcaseImage.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}/showcase/${uuidv4()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('userprofile')
        .upload(fileName, showcaseImage, {
          cacheControl: '3600',
          upsert: true,
          contentType: showcaseImage.type
        });

      if (uploadError) {
        console.error('Showcase image upload error:', uploadError);
        return { error: `Failed to upload showcase image: ${uploadError.message}` };
      }

      const { data: { publicUrl } } = supabase.storage
        .from('userprofile')
        .getPublicUrl(fileName);

      updateData.showcase_image_url = publicUrl;
      console.log('Showcase image uploaded successfully:', publicUrl);
    }

    // Handle portfolio gallery uploads
    const existingGalleryPhotos = formData.get('existingGalleryPhotos') as string;
    let existingUrls: string[] = [];
    try {
      existingUrls = existingGalleryPhotos ? JSON.parse(existingGalleryPhotos) : [];
    } catch (e) {
      console.error('Error parsing existing gallery photos:', e);
    }

    // Upload new gallery photos
    const uploadedGalleryUrls: string[] = [];
    for (let i = 0; i < 10; i++) { // Check for up to 10 gallery photos
      const galleryFile = formData.get(`gallery_${i}`) as File;
      if (galleryFile && galleryFile.size > 0) {
        console.log(`Uploading gallery image ${i}:`, {
          name: galleryFile.name,
          size: galleryFile.size,
          type: galleryFile.type
        });

        const fileExt = galleryFile.name.split('.').pop() || 'jpg';
        const fileName = `${user.id}/gallery/${uuidv4()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('muaportfolio')
          .upload(fileName, galleryFile, {
            cacheControl: '3600',
            upsert: true,
            contentType: galleryFile.type
          });

        if (uploadError) {
          console.error(`Gallery image ${i} upload error:`, uploadError);
          // Continue with other images even if one fails
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('muaportfolio')
            .getPublicUrl(fileName);
          uploadedGalleryUrls.push(publicUrl);
          console.log(`Gallery image ${i} uploaded successfully:`, publicUrl);
        }
      }
    }

    // Update users table
    const { error: userUpdateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id);

    if (userUpdateError) {
      console.error('User update error:', userUpdateError);
      return { error: `Failed to update user profile: ${userUpdateError.message}` };
    }

    // Update portfolio images if any new ones were uploaded
    if (uploadedGalleryUrls.length > 0) {
      // First delete existing portfolio images
      await supabase
        .from('portfolio_images')
        .delete()
        .eq('user_id', user.id);

      // Insert new portfolio images (existing + new)
      const allGalleryUrls = [...existingUrls, ...uploadedGalleryUrls];
      const portfolioInserts = allGalleryUrls.map((url, index) => ({
        user_id: user.id,
        image_url: url,
        order_number: index + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      if (portfolioInserts.length > 0) {
        const { error: portfolioError } = await supabase
          .from('portfolio_images')
          .insert(portfolioInserts);

        if (portfolioError) {
          console.error('Portfolio images error:', portfolioError);
          // Don't fail the whole update for portfolio errors
        }
      }
    }

    // If user is a streamer, also update streamers table
    const { data: streamerData } = await supabase
      .from('streamers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (streamerData) {
      const streamerUpdateData = {
        first_name: firstName,
        last_name: lastName,
        location: location,
        ...(updateData.image_url && { image_url: updateData.image_url })
      };

      const { error: streamerUpdateError } = await supabase
        .from('streamers')
        .update(streamerUpdateData)
        .eq('user_id', user.id);

      if (streamerUpdateError) {
        console.error('Streamer update error:', streamerUpdateError);
        return { error: `Failed to update streamer profile: ${streamerUpdateError.message}` };
      }
    }

    console.log('Profile update completed successfully');
    return { 
      success: true, 
      profilePictureUrl: updateData.image_url 
    };

  } catch (error) {
    console.error('Profile update error:', error);
    return { error: `Profile update failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

export async function streamerSignUpAction(formData: FormData): Promise<SignUpResponse> {
  try {
    const supabase = createClient();

    // First, handle image uploads before user creation
    let profileImageUrl = null;
    const profileImage = formData.get('image') as File;
    
    if (profileImage && profileImage.size > 0) {
      const fileExt = profileImage.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${timestamp}_${profileImage.name.toLowerCase()}`;

      console.log('Uploading profile image:', {
        fileName,
        fileType: profileImage.type,
        fileSize: profileImage.size
      });

      // Create user first to get the user ID
      const { data: { user }, error: authError } = await supabase.auth.signUp({
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        options: {
          data: {
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            user_type: 'streamer',
            location: formData.get('city'),
          },
        },
      });

      if (authError || !user) throw authError;

      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile_picture')
        .upload(filePath, profileImage, {
          cacheControl: '3600',
          upsert: true,
          contentType: profileImage.type
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Failed to upload profile image: ' + uploadError.message);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('profile_picture')
        .getPublicUrl(filePath);

      profileImageUrl = publicUrl;

      // Sequential gallery photos upload with retry mechanism
      const galleryFiles = formData.getAll('gallery') as File[];
      const uploadedGalleryUrls: { url: string; order_number: number }[] = [];
      const maxRetries = 3;

      for (let i = 0; i < galleryFiles.length; i++) {
        const file = galleryFiles[i];
        let retryCount = 0;
        let uploadSuccess = false;

        while (retryCount < maxRetries && !uploadSuccess) {
          try {
            const galleryFileName = `${timestamp}-gallery-${i}`;
            const galleryPath = `streamers/${user.id}/${galleryFileName}`;

            console.log(`Uploading gallery image ${i + 1}/${galleryFiles.length}:`, {
              galleryPath,
              fileType: file.type,
              fileSize: file.size,
              retryAttempt: retryCount + 1
            });

            const { error: uploadError } = await supabase.storage
              .from('gallery_images')
              .upload(galleryPath, file, {
                cacheControl: '3600',
                upsert: true,
                contentType: file.type
              });

            if (uploadError) {
              throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
              .from('gallery_images')
              .getPublicUrl(galleryPath);

            uploadedGalleryUrls.push({
              url: publicUrl,
              order_number: i
            });

            uploadSuccess = true;
            console.log(`Successfully uploaded gallery image ${i + 1}/${galleryFiles.length}`);

          } catch (error) {
            console.error(`Error uploading gallery image ${i + 1}, attempt ${retryCount + 1}:`, error);
            retryCount++;

            if (retryCount === maxRetries) {
              // If all retries failed, clean up previously uploaded files and throw error
              console.error(`Failed to upload gallery image ${i + 1} after ${maxRetries} attempts`);
              
              // Clean up previously uploaded gallery images
              await Promise.all(uploadedGalleryUrls.map(async (photo) => {
                const pathParts = new URL(photo.url).pathname.split('/');
                const fileName = pathParts[pathParts.length - 1];
                const filePath = `streamers/${user.id}/${fileName}`;
                
                await supabase.storage
                  .from('gallery_images')
                  .remove([filePath]);
              }));

              throw new Error(`Failed to upload gallery image ${i + 1} after ${maxRetries} attempts`);
            }

            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          }
        }
      }

      // Begin database transaction
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: formData.get('email') as string,
          first_name: formData.get('first_name') as string,
          last_name: formData.get('last_name') as string,
          user_type: 'streamer',
          location: formData.get('city') as string,
          image_url: profileImageUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (userError) throw userError;

      // Create streamer profile
      const { data: streamerData, error: streamerError } = await supabase
        .from('streamers')
        .insert({
          user_id: user.id,
          first_name: formData.get('first_name') as string,
          last_name: formData.get('last_name') as string,
          platform: (formData.getAll('platforms') as string[]).join(','),
          category: (formData.getAll('categories') as string[]).join(','),
          price: parseInt((formData.get('price') as string)?.replace(/\./g, '') || '0'),
          image_url: profileImageUrl,
          bio: formData.get('bio') as string,
          location: formData.get('city') as string,
          full_address: formData.get('full_address') as string,
          video_url: formData.get('video_url') as string,
          gender: formData.get('gender') as string,
          age: parseInt(formData.get('age') as string),
          experience: formData.get('experience') as string,
        })
        .select()
        .single();

      if (streamerError) throw streamerError;

      // Add gallery photos to database with error handling
      if (uploadedGalleryUrls.length > 0) {
        const { error: galleryError } = await supabase
          .from('streamer_gallery_photos')
          .insert(
            uploadedGalleryUrls.map(photo => ({
              streamer_id: streamerData.id,
              photo_url: photo.url,
              order_number: photo.order_number,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }))
          );

        if (galleryError) {
          // If gallery database insert fails, clean up uploaded files
          await Promise.all(uploadedGalleryUrls.map(async (photo) => {
            const pathParts = new URL(photo.url).pathname.split('/');
            const fileName = pathParts[pathParts.length - 1];
            const filePath = `streamers/${user.id}/${fileName}`;
            
            await supabase.storage
              .from('gallery_images')
              .remove([filePath]);
          }));

          throw galleryError;
        }
      }

      return {
        success: true,
        redirectTo: '/streamer-dashboard'
      };
    } else {
      throw new Error('Profile image is required');
    }
  } catch (error) {
    console.error('Streamer sign up error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create account. Please try again.'
    };
  }
}

export async function updateStreamerProfile(formData: FormData): Promise<StreamerProfileResponse> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Handle profile picture upload if present
    let imageUrl;
    const image = formData.get('image') as File;
    if (image && image.size > 0) {
      const fileName = `${user.id}/${Date.now()}_${sanitizeFileName(image.name)}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('profile_picture')
        .upload(filePath, image, {
          cacheControl: '3600',
          upsert: true,
          contentType: image.type
        });

      if (uploadError) throw uploadError;
      imageUrl = supabase.storage
        .from('profile_picture')
        .getPublicUrl(filePath).data.publicUrl;
    }

    // Update streamer profile basic info
    const updateData = {
      first_name: formData.get('firstName'),
      last_name: formData.get('lastName'),
      location: formData.get('location'),
      video_url: formData.get('youtubeVideoUrl'),
      platform: formData.get('platform'),
      category: formData.get('category'),
      bio: formData.get('bio'),
      gender: formData.get('gender'),
      age: parseInt(formData.get('age') as string) || null,
      experience: formData.get('experience'),
      full_address: formData.get('fullAddress'),
      ...(imageUrl && { image_url: imageUrl }),
    };

    console.log('Updating streamer profile with data:', updateData);

    const { error: updateError } = await supabase
      .from('streamers')
      .update(updateData)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating streamer profile:', updateError);
      throw updateError;
    }

    // Get streamer ID first
    const { data: streamerData, error: streamerError } = await supabase
      .from('streamers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (streamerError) throw streamerError;

    // Handle gallery photos with sequential upload and retry mechanism
    const existingPhotos = JSON.parse(formData.get('existingGalleryPhotos') as string || '[]');
    const galleryFiles = formData.getAll('gallery') as File[];
    const maxRetries = 3;
    const uploadedGalleryUrls: string[] = [];
    
    try {
      // First, delete existing gallery photos from storage
      const { data: existingFiles, error: listError } = await supabase.storage
        .from('gallery_images')
        .list(`${user.id}`);

      if (!listError && existingFiles) {
        await Promise.all(existingFiles.map(file => 
          supabase.storage
            .from('gallery_images')
            .remove([`${user.id}/${file.name}`])
        ));
      }

      // Delete existing gallery photo records
      await supabase
        .from('streamer_gallery_photos')
        .delete()
        .eq('streamer_id', streamerData.id);

      // Sequential upload of new gallery photos with retry mechanism
      for (let i = 0; i < galleryFiles.length; i++) {
        const file = galleryFiles[i];
        let retryCount = 0;
        let uploadSuccess = false;

        while (retryCount < maxRetries && !uploadSuccess) {
          try {
            const fileName = `${user.id}/${Date.now()}_${sanitizeFileName(file.name)}`;
            
            console.log(`Uploading gallery image ${i + 1}/${galleryFiles.length}:`, {
              fileName,
              fileType: file.type,
              fileSize: file.size,
              retryAttempt: retryCount + 1
            });

            const { error: uploadError } = await supabase.storage
              .from('gallery_images')
              .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true,
                contentType: file.type
              });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
              .from('gallery_images')
              .getPublicUrl(fileName);

            uploadedGalleryUrls.push(publicUrl);
            uploadSuccess = true;
            console.log(`Successfully uploaded gallery image ${i + 1}/${galleryFiles.length}`);

          } catch (error) {
            console.error(`Error uploading gallery image ${i + 1}, attempt ${retryCount + 1}:`, error);
            retryCount++;

            if (retryCount === maxRetries) {
              // If all retries failed, clean up previously uploaded files
              console.error(`Failed to upload gallery image ${i + 1} after ${maxRetries} attempts`);
              
              // Clean up previously uploaded gallery images
              await Promise.all(uploadedGalleryUrls.map(async (url) => {
                const pathParts = new URL(url).pathname.split('/');
                const fileName = pathParts[pathParts.length - 1];
                const filePath = `${user.id}/${fileName}`;
                
                await supabase.storage
                  .from('gallery_images')
                  .remove([filePath]);
              }));

              throw new Error(`Failed to upload gallery image ${i + 1} after ${maxRetries} attempts`);
            }

            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          }
        }
      }

      // Combine existing and new photos
      const allPhotos = [...existingPhotos, ...uploadedGalleryUrls];
      
      // Insert all gallery photos with proper error handling
      if (allPhotos.length > 0) {
        const galleryInserts = allPhotos.map((photo_url, index) => ({
          streamer_id: streamerData.id,
          photo_url,
          order_number: index + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        const { error: galleryError } = await supabase
          .from('streamer_gallery_photos')
          .insert(galleryInserts);

        if (galleryError) {
          // If gallery database insert fails, clean up uploaded files
          await Promise.all(uploadedGalleryUrls.map(async (url) => {
            const pathParts = new URL(url).pathname.split('/');
            const fileName = pathParts[pathParts.length - 1];
            const filePath = `${user.id}/${fileName}`;
            
            await supabase.storage
              .from('gallery_images')
              .remove([filePath]);
          }));

          throw galleryError;
        }
      }

      return {
        success: true,
        imageUrl: imageUrl
      };

    } catch (error) {
      // Clean up any uploaded files if there's an error
      await Promise.all(uploadedGalleryUrls.map(async (url) => {
        const pathParts = new URL(url).pathname.split('/');
        const fileName = pathParts[pathParts.length - 1];
        const filePath = `${user.id}/${fileName}`;
        
        await supabase.storage
          .from('gallery_images')
          .remove([filePath]);
      }));

      throw error;
    }

  } catch (error) {
    console.error('Error updating streamer profile:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update profile' 
    };
  }
}

export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Error signing out:", error);
    return false;
  }
  revalidatePath("/", "layout");
  return true;
}

export async function acceptBooking(bookingId: number) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    // Fetch the booking first
    const { data: bookingData, error: bookingFetchError } = await supabase
      .from('bookings')
      .select('*, streamers(first_name, last_name)')
      .eq('id', bookingId)
      .single();

    if (bookingFetchError) throw bookingFetchError;

    // Update booking status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'accepted' })
      .eq('id', bookingId);

    if (updateError) throw updateError;

    // Create notification using direct approach
    await createNotification({
      user_id: bookingData.client_id,
      streamer_id: bookingData.streamer_id,
      message: `${bookingData.streamers.first_name} telah menerima booking Anda untuk ${format(new Date(bookingData.start_time), 'dd MMMM HH:mm')} pada platform ${bookingData.platform}.`,
      type: 'booking_accepted',
      booking_id: bookingId,
      is_read: false
    });

    revalidatePath('/streamer-dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error accepting booking:', error);
    return { error: 'Failed to accept booking: ' + (error instanceof Error ? error.message : String(error)) };
  }
}

export async function rejectBooking(bookingId: number) {
  const supabase = createClient();
  
  try {
    // Fetch the booking first to get client and streamer details
    const { data: bookingData, error: bookingFetchError } = await supabase
      .from('bookings')
      .select('*, streamers(first_name, last_name)')
      .eq('id', bookingId)
      .single();

    if (bookingFetchError) throw bookingFetchError;

    // Update booking status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'rejected' })
      .eq('id', bookingId);

    if (updateError) throw updateError;

    // Create notification with proper type and error handling
    await createNotification({
      user_id: bookingData.client_id,
      streamer_id: bookingData.streamer_id,
      message: `${bookingData.streamers.first_name} ${bookingData.streamers.last_name} telah menolak booking Anda untuk ${format(new Date(bookingData.start_time), 'dd MMMM HH:mm')} pada platform ${bookingData.platform}.`,
      type: 'booking_rejected',
      booking_id: bookingId,
      is_read: false
    });

    revalidatePath('/streamer-dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error rejecting booking:', error);
    return { error: 'Failed to reject booking: ' + (error instanceof Error ? error.message : String(error)) };
  }
}

export async function startStream(bookingId: number, streamLink: string) {
  const supabase = createClient();

  try {
    // 1. Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Not authenticated');
    }

    // 2. Fetch booking data with streamer info
    const { data: bookingData, error: bookingFetchError } = await supabase
      .from('bookings')
      .select(`
        *,
        streamers!inner(
          id,
          user_id,
          first_name,
          last_name
        )
      `)
      .eq('id', bookingId)
      .single();

    if (bookingFetchError) throw bookingFetchError;
    if (!bookingData) throw new Error('Booking not found');

    // 3. Verify authorization (streamer owns the booking)
    if (bookingData.streamers.user_id !== user.id) {
      throw new Error('Unauthorized to start this stream');
    }

    // 4. Verify booking status and items received
    if (bookingData.status !== 'accepted') {
      throw new Error('Booking must be in accepted status to start stream');
    }
    if (!bookingData.items_received) {
      throw new Error('Items must be received before starting stream');
    }

    // 5. Validate stream link
    if (!streamLink || !streamLink.trim()) {
      throw new Error('Stream link is required');
    }
    try {
      new URL(streamLink);
    } catch {
      throw new Error('Invalid stream link format');
    }

    // 6. Update the booking with optimistic locking
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        stream_link: streamLink, 
        status: 'live',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .eq('status', 'accepted'); // Ensure status hasn't changed

    if (updateError) throw updateError;

    // 7. Create notification
    try {
      await createStreamNotifications({
        client_id: bookingData.client_id,
        streamer_id: bookingData.streamer_id,
        booking_id: bookingId,
        streamer_name: `${bookingData.streamers.first_name} ${bookingData.streamers.last_name}`,
        start_time: format(new Date(bookingData.start_time), 'dd MMMM HH:mm'),
        platform: bookingData.platform,
        stream_link: streamLink,
        type: 'stream_started'
      });
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
      // Don't throw here as the main operation succeeded
    }

    revalidatePath('/streamer-dashboard');
    return { success: true, updatedBooking: bookingData };
  } catch (error) {
    console.error('Error starting stream:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to start stream'
    };
  }
}

export async function endStream(bookingId: number) {
  const supabase = createClient();

  try {
    // Fetch booking data first
    const { data: bookingData, error: bookingFetchError } = await supabase
      .from('bookings')
      .select('*, streamers(first_name, last_name)')
      .eq('id', bookingId)
      .single();

    if (bookingFetchError) throw bookingFetchError;
    if (!bookingData) throw new Error('Booking not found');

    // Update the booking status to 'completed'
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (updateError) throw updateError;

    // Get streamer name safely
    if (!bookingData.streamers?.first_name) {
      console.error('Streamer data not found in booking:', bookingData);
      throw new Error('Streamer data not found');
    }

    // Create notification using the helper function with proper error handling
    await createStreamNotifications({
      client_id: bookingData.client_id,
      streamer_id: bookingData.streamer_id,
      booking_id: bookingId,
      streamer_name: bookingData.streamers.first_name,
      start_time: format(new Date(bookingData.start_time), 'dd MMMM HH:mm'),
      platform: bookingData.platform,
      type: 'stream_ended'
    });

    revalidatePath('/streamer-dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error ending stream:', error);
    return { success: false, error: 'Failed to end stream: ' + (error instanceof Error ? error.message : String(error)) };
  }
}

export async function updateStreamerPrice(streamerId: number, newPrice: number) {
  try {
    const supabase = createClient();

    // Debug log
    console.log('Updating price for streamer:', { streamerId, newPrice });

    // Get current price first
    const { data: currentStreamer, error: streamerError } = await supabase
      .from('streamers')
      .select('price, user_id')
      .eq('id', streamerId)
      .single();

    if (streamerError) {
      console.error('Error fetching streamer:', streamerError);
      throw new Error('Streamer not found');
    }

    // Verify ownership
    const { data: { user } } = await supabase.auth.getUser();
    if (currentStreamer.user_id !== user?.id) {
      throw new Error('Unauthorized');
    }

    // Begin transaction
    // 1. Update streamer's current price
    const { error: updateError } = await supabase
      .from('streamers')
      .update({ 
        price: newPrice,
        last_price_update: new Date().toISOString()
      })
      .eq('id', streamerId);

    if (updateError) {
      console.error('Error updating streamer price:', updateError);
      throw updateError;
    }

    // 2. Try to insert first
    const { error: insertError } = await supabase
      .from('streamer_current_discounts')
      .insert({
        streamer_id: streamerId,
        current_price: newPrice,
        previous_price: currentStreamer.price,
        discount_percentage: newPrice < currentStreamer.price 
          ? Math.round(((currentStreamer.price - newPrice) / currentStreamer.price) * 100)
          : null,
        last_price_update: new Date().toISOString(),
        next_available_update: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });

    // If insert fails (record exists), try update
    if (insertError) {
      console.log('Insert failed, trying update:', insertError);
      const { error: updateDiscountError } = await supabase
        .from('streamer_current_discounts')
        .update({
          current_price: newPrice,
          previous_price: currentStreamer.price,
          discount_percentage: newPrice < currentStreamer.price 
            ? Math.round(((currentStreamer.price - newPrice) / currentStreamer.price) * 100)
            : null,
          last_price_update: new Date().toISOString(),
          next_available_update: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('streamer_id', streamerId);

      if (updateDiscountError) {
        console.error('Error updating discount:', updateDiscountError);
        throw updateDiscountError;
      }
    }

    return {
      success: true,
      message: 'Price updated successfully',
      current_price: newPrice,
      previous_price: currentStreamer.price,
      discount_percentage: newPrice < currentStreamer.price 
        ? Math.round(((currentStreamer.price - newPrice) / currentStreamer.price) * 100)
        : null
    };

  } catch (error) {
    console.error('Error in updateStreamerPrice:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update price' 
    };
  }
}

export async function acceptItems(bookingId: number) {
  const supabase = createClient();
  
  try {
    // First verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Not authenticated');
    }

    // Fetch the booking first to get client and streamer details
    const { data: bookingData, error: bookingFetchError } = await supabase
      .from('bookings')
      .select('*, streamers(first_name, last_name, user_id)')
      .eq('id', bookingId)
      .single();

    if (bookingFetchError) {
      throw new Error(`Failed to fetch booking: ${bookingFetchError.message}`);
    }

    // Verify the streamer has permission to accept items for this booking
    if (!bookingData || bookingData.streamers.user_id !== user.id) {
      throw new Error('Unauthorized to accept items for this booking');
    }

    // Update booking status with optimistic locking
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        items_received: true,
        items_received_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .eq('items_received', false) // Ensure item hasn't been received yet
      .select();

    if (updateError) {
      throw new Error(`Failed to update booking: ${updateError.message}`);
    }

    // Create notification with proper error handling
    try {
      await createItemReceivedNotification({
        client_id: bookingData.client_id,
        streamer_id: bookingData.streamer_id,
        booking_id: bookingId,
        streamer_name: `${bookingData.streamers.first_name} ${bookingData.streamers.last_name}`
      });
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
      // Don't throw here, as the main operation succeeded
    }

    revalidatePath('/streamer-dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error accepting items:', error);
    return { 
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

export async function requestReschedule(bookingId: number, reason: string) {
  const supabase = createClient();
  
  try {
    // Fetch the booking first to get client and streamer details
    const { data: bookingData, error: bookingFetchError } = await supabase
      .from('bookings')
      .select('*, streamers(first_name, last_name)')
      .eq('id', bookingId)
      .single();

    if (bookingFetchError) throw bookingFetchError;

    // Update booking status with reason
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        status: 'reschedule_requested',
        updated_at: new Date().toISOString(),
        reason: reason
      })
      .eq('id', bookingId);

    if (updateError) throw updateError;

    // Create notification for client
    await createNotification({
      user_id: bookingData.client_id,
      streamer_id: bookingData.streamer_id,
      message: `${bookingData.streamers.first_name} ${bookingData.streamers.last_name} mengajukan reschedule untuk sesi live streaming Anda. Alasan: ${reason}`,
      type: 'reschedule_request',
      booking_id: bookingId,
      is_read: false
    });

    revalidatePath('/streamer-dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error requesting reschedule:', error);
    return { error: 'Failed to request reschedule: ' + (error instanceof Error ? error.message : String(error)) };
  }
}