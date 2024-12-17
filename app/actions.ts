"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { SignUpResponse } from "@/app/types/auth";

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
        profile_picture_url: null,
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

    // Return success response
    return {
      success: true,
      redirectTo: '/client-onboarding'
    };
    
  } catch (error) {
    console.error('Sign up error:', error);
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

  // Verify user type is 'client'
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('user_type')
    .eq('id', data.user.id)
    .single();

  if (userError || !userData) {
    await supabase.auth.signOut();
    return encodedRedirect("error", "/sign-in", "Error verifying user type");
  }

  if (userData.user_type !== 'client') {
    await supabase.auth.signOut();
    return encodedRedirect("error", "/sign-in", "Please use the streamer login page if you're a streamer");
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

    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const location = formData.get('location') as string;
    const image = formData.get('image') as File;

    // First update the users table
    const updateData: any = {
      first_name: firstName,
      last_name: lastName,
      location: location,
      updated_at: new Date().toISOString(),
    };

    // Handle profile picture upload if present
    if (image && image.size > 0) {
      const fileExt = image.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}/${uuidv4()}.${fileExt}`;
      const filePath = `profile_picture/${fileName}`;

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('profile_picture')
        .upload(filePath, image, {
          cacheControl: '3600',
          upsert: true,
          contentType: image.type
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return { error: 'Failed to upload profile image' };
      }

      const { data: { publicUrl } } = supabase.storage
        .from('profile_picture')
        .getPublicUrl(filePath);

      updateData.profile_picture_url = publicUrl;
    }

    // Update users table
    const { error: userUpdateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id);

    if (userUpdateError) {
      console.error('User update error:', userUpdateError);
      return { error: 'Failed to update user profile' };
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
        ...(updateData.profile_picture_url && { image_url: updateData.profile_picture_url })
      };

      const { error: streamerUpdateError } = await supabase
        .from('streamers')
        .update(streamerUpdateData)
        .eq('user_id', user.id);

      if (streamerUpdateError) {
        console.error('Streamer update error:', streamerUpdateError);
        return { error: 'Failed to update streamer profile' };
      }
    }

    return { 
      success: true, 
      profilePictureUrl: updateData.profile_picture_url 
    };

  } catch (error) {
    console.error('Profile update error:', error);
    return { error: 'Failed to update profile' };
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

      // Handle gallery photos upload
      const galleryFiles = formData.getAll('gallery') as File[];
      const galleryUrls = await Promise.all(
        galleryFiles.map(async (file, index) => {
          const galleryFileName = `${timestamp}-gallery`;
          const galleryPath = `streamers/${user.id}/${galleryFileName}`;

          console.log('Uploading gallery image:', {
            galleryPath,
            fileType: file.type,
            fileSize: file.size
          });

          const { error: uploadError } = await supabase.storage
            .from('gallery_images')
            .upload(galleryPath, file, {
              cacheControl: '3600',
              upsert: true,
              contentType: file.type
            });

          if (uploadError) {
            console.error('Gallery upload error:', uploadError);
            throw new Error(`Failed to upload gallery image ${index + 1}: ${uploadError.message}`);
          }

          const { data: { publicUrl } } = supabase.storage
            .from('gallery_images')
            .getPublicUrl(galleryPath);

          return {
            url: publicUrl,
            order_number: index
          };
        })
      );

      // Create user record
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: formData.get('email') as string,
          first_name: formData.get('first_name') as string,
          last_name: formData.get('last_name') as string,
          user_type: 'streamer',
          location: formData.get('city') as string,
          profile_picture_url: profileImageUrl,
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
        })
        .select()
        .single();

      if (streamerError) throw streamerError;

      // Add gallery photos to database
      if (galleryUrls.length > 0) {
        const { error: galleryError } = await supabase
          .from('streamer_gallery_photos')
          .insert(
            galleryUrls.map((photo, index) => ({
              streamer_id: streamerData.id,
              photo_url: photo.url,
              order_number: index,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }))
          );

        if (galleryError) throw galleryError;
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
      const fileName = `${user.id}/${Date.now()}_${image.name}`;
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
      ...(imageUrl && { image_url: imageUrl }),
    };

    const { error: updateError } = await supabase
      .from('streamers')
      .update(updateData)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    // Get streamer ID first
    const { data: streamerData, error: streamerError } = await supabase
      .from('streamers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (streamerError) throw streamerError;

    // Handle gallery photos
    const existingPhotos = JSON.parse(formData.get('existingGalleryPhotos') as string || '[]');
    
    // First, delete existing gallery photos from storage
    const { data: existingFiles, error: listError } = await supabase.storage
      .from('gallery_images')
      .list(`${user.id}`);

    if (!listError && existingFiles) {
      for (const file of existingFiles) {
        await supabase.storage
          .from('gallery_images')
          .remove([`${user.id}/${file.name}`]);
      }
    }

    // Delete existing gallery photo records
    await supabase
      .from('streamer_gallery_photos')
      .delete()
      .eq('streamer_id', streamerData.id);

    // Upload new gallery photos
    const newGalleryUrls = [];
    const galleryFiles = formData.getAll('gallery') as File[];
    
    console.log('Gallery files to upload:', galleryFiles); // Debug log

    for (const photo of galleryFiles) {
      const fileName = `${user.id}/${Date.now()}_${photo.name}`;
      
      console.log('Uploading file:', fileName); // Debug log
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('gallery_images')
        .upload(fileName, photo, {
          cacheControl: '3600',
          upsert: true,
          contentType: photo.type
        });

      if (uploadError) {
        console.error('Gallery upload error:', uploadError);
        continue;
      }

      console.log('Upload successful:', uploadData); // Debug log
      
      const { data: { publicUrl } } = supabase.storage
        .from('gallery_images')
        .getPublicUrl(fileName);
      
      newGalleryUrls.push(publicUrl);
    }

    console.log('New gallery URLs:', newGalleryUrls); // Debug log

    // Insert all gallery photos
    const allPhotos = [...existingPhotos, ...newGalleryUrls];
    const galleryInserts = allPhotos.map((photo_url, index) => ({
      streamer_id: streamerData.id,
      photo_url,
      order_number: index + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    if (galleryInserts.length > 0) {
      console.log('Inserting gallery records:', galleryInserts); // Debug log
      
      const { error: galleryError } = await supabase
        .from('streamer_gallery_photos')
        .insert(galleryInserts);

      if (galleryError) {
        console.error('Gallery insert error:', galleryError);
        throw galleryError;
      }
    }

    return {
      success: true,
      imageUrl: imageUrl
    };

  } catch (error) {
    console.error('Error updating streamer profile:', error);
    return { success: false, error: 'Failed to update profile' };
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
    // Fetch the booking first to get the correct types
    const { data: bookingData, error: bookingFetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingFetchError) {
      console.error('Error fetching booking:', bookingFetchError);
      throw bookingFetchError;
    }

    // Now update the booking status
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'accepted' })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }

    // Create notification for client
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('User data fetch error:', userError);
      throw userError;
    }

    const streamerName = userData ? `${userData.first_name} ${userData.last_name}` : 'The streamer';
    const clientNotificationMessage = `${streamerName} has accepted your booking for ${new Date(bookingData.start_time).toLocaleString()} - ${new Date(bookingData.end_time).toLocaleString()} on ${bookingData.platform}.`;

    const { error: notificationError } = await supabase.from('notifications').insert({
      user_id: bookingData.client_id,
      message: clientNotificationMessage,
      type: 'confirmation',
      is_read: false
    });

    if (notificationError) {
      console.error('Notification creation error:', notificationError);
      throw notificationError;
    }

    revalidatePath('/streamer-dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error accepting booking:', error);
    return { error: 'Failed to accept booking: ' + (error instanceof Error ? error.message : String(error)) };
  }
}

export async function rejectBooking(bookingId: number) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    // Update booking status to 'rejected'
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'rejected' })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
      console.error('Booking update error:', error);
      throw error;
    }

    // Create notification for client
    const clientNotificationMessage = `Your booking for ${new Date(data.start_time).toLocaleString()} - ${new Date(data.end_time).toLocaleString()} on ${data.platform} has been rejected.`;

    const { error: notificationError } = await supabase.from('notifications').insert({
      user_id: data.client_id,
      message: clientNotificationMessage,
      type: 'warning',
      is_read: false
    });

    if (notificationError) {
      console.error('Notification creation error:', notificationError);
      throw notificationError;
    }

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
    console.log(`Starting stream for booking ${bookingId} with link ${streamLink}`);

    // Update the booking with the stream link and change status to 'live'
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({ stream_link: streamLink, status: 'live' })
      .eq('id', bookingId)
      .select('client_id, streamer_id, start_time, end_time, platform')
      .single();

    if (updateError) {
      console.error('Error updating booking:', updateError);
      throw updateError;
    }

    if (!updatedBooking) {
      console.error('Booking not found');
      throw new Error('Booking not found');
    }

    console.log('Updated booking:', updatedBooking);

    // Get streamer name
    const { data: streamerData, error: streamerError } = await supabase
      .from('streamers')
      .select('first_name, last_name')
      .eq('id', updatedBooking.streamer_id)
      .single();

    if (streamerError) {
      console.error('Error fetching streamer data:', streamerError);
      throw streamerError;
    }

    console.log('Streamer data:', streamerData);

    // Create a notification for the client
    const notificationMessage = `${streamerData.first_name} ${streamerData.last_name} has started their live stream for your booking on ${new Date(updatedBooking.start_time).toLocaleString()} - ${new Date(updatedBooking.end_time).toLocaleString()} on ${updatedBooking.platform}. Join here: ${streamLink}`;
    
    console.log('Creating notification with message:', notificationMessage);

    const { data: notificationData, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: updatedBooking.client_id,
        message: notificationMessage,
        type: 'info', // Changed from 'stream_started' to 'info'
        is_read: false,
        streamer_id: updatedBooking.streamer_id,
        booking_id: bookingId
      })
      .select()
      .single();

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      throw notificationError;
    }

    console.log('Created notification:', notificationData);

    revalidatePath('/streamer-dashboard');
    return { success: true, updatedBooking };
  } catch (error) {
    console.error('Error starting stream:', error);
    return { success: false, error: 'Failed to start stream' };
  }
}

export async function endStream(bookingId: number) {
  const supabase = createClient();

  try {
    // Update the booking status to 'completed'
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'completed' })
      .eq('id', bookingId)
      .select('client_id, streamer_id, start_time, end_time, platform')
      .single();

    if (updateError) throw updateError;

    if (!updatedBooking) {
      throw new Error('Booking not found');
    }

    // Get streamer name
    const { data: streamerData, error: streamerError } = await supabase
      .from('streamers')
      .select('first_name, last_name')
      .eq('id', updatedBooking.streamer_id)
      .single();

    if (streamerError) throw streamerError;

    // Create a notification for the client
    const notificationMessage = `${streamerData.first_name} ${streamerData.last_name} has ended their live stream for your booking on ${new Date(updatedBooking.start_time).toLocaleString()} - ${new Date(updatedBooking.end_time).toLocaleString()} on ${updatedBooking.platform}.`;
    
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: updatedBooking.client_id,
        message: notificationMessage,
        type: 'info', // Changed from 'stream_ended' to 'info'
        is_read: false,
        streamer_id: updatedBooking.streamer_id,
        booking_id: bookingId
      });

    if (notificationError) throw notificationError;

    revalidatePath('/streamer-dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error ending stream:', error);
    return { success: false, error: 'Failed to end stream' };
  }
}