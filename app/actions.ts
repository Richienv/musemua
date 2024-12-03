"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

// Add this helper function at the top of the file
function sanitizeFileName(fileName: string): string {
  // Remove special characters and spaces, replace with underscores
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\s+/g, '_')
    .toLowerCase();
}

export async function signUpAction(formData: FormData) {
  const supabase = createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirm_password") as string;
  const firstName = formData.get("first_name") as string;
  const lastName = formData.get("last_name") as string;
  const brandName = formData.get("username") as string;
  const location = formData.get("location") as string;
  const brandGuidelineFile = formData.get("product_doc") as File;
  const origin = headers().get("origin");

  if (password !== confirmPassword) {
    return encodedRedirect("error", "/sign-up", "Passwords do not match");
  }

  // 1. First create the user
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
      },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (authError) {
    return encodedRedirect("error", "/sign-up", authError.message);
  }

  // 2. Then upload the file using the new user's session
  let brandGuidelineUrl = null;
  if (brandGuidelineFile && authData.user) {
    const fileName = `${authData.user.id}/${Date.now()}_${sanitizeFileName(brandGuidelineFile.name)}`;

    const { error: uploadError, data } = await supabase.storage
      .from('brand_guideline')
      .upload(fileName, brandGuidelineFile, {
        cacheControl: '3600',
        upsert: false,
        contentType: brandGuidelineFile.type
      });

    if (uploadError) {
      // Clean up: delete the user if file upload fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return encodedRedirect("error", "/sign-up", "Failed to upload brand guideline");
    }

    brandGuidelineUrl = supabase.storage
      .from('brand_guideline')
      .getPublicUrl(fileName).data.publicUrl;
  }

  // 3. Finally, create the user profile with the file URL
  if (authData.user) {
    const { error: profileError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        first_name: firstName,
        last_name: lastName,
        user_type: 'client',
        brand_name: brandName,
        brand_guidelines_url: brandGuidelineUrl,
        location: location,
        profile_picture_url: null,
        bio: null,
      });

    if (profileError) {
      // Clean up: delete user and uploaded file if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return encodedRedirect("error", "/sign-up", "Failed to create user profile");
    }
  }

  return redirect("/sign-in");
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
    const cookieStore = cookies();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { error: 'Not authenticated' };
    }

    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const bio = formData.get('bio') as string;
    const image = formData.get('image') as File;

    let profilePictureUrl = null;
    if (image && image.size > 0) {
      const fileExt = image.name.split('.').pop() || 'jpg'; // Default to jpg if no extension
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `profile_picture/${fileName}`;

      // Create blob with proper type
      const blob = new Blob([image], { type: image.type });

      const { error: uploadError } = await supabase.storage
        .from('profile_picture')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: true,
          contentType: image.type // Explicitly set content type
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return { error: 'Failed to upload profile image' };
      }

      const { data: { publicUrl } } = supabase.storage
        .from('profile_picture')
        .getPublicUrl(filePath);

      profilePictureUrl = publicUrl;
    }

    const updateData: any = {
      first_name: firstName,
      last_name: lastName,
      bio: bio,
      updated_at: new Date().toISOString(),
    };

    if (profilePictureUrl) {
      updateData.profile_picture_url = profilePictureUrl;
    }

    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id);

    if (updateError) {
      return { error: 'Failed to update profile' };
    }

    return { 
      success: true, 
      profilePictureUrl: profilePictureUrl || undefined 
    };

  } catch (error) {
    console.error('Profile update error:', error);
    return { error: 'Failed to update profile' };
  }
}

export async function streamerSignUpAction(formData: FormData) {
  const supabase = createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirm_password") as string;
  const firstName = formData.get("first_name") as string;
  const lastName = formData.get("last_name") as string;
  const platform = formData.get("platform") as string;
  const category = formData.get("category") as string;
  const bio = formData.get("bio") as string;
  const image = formData.get("image") as File | null;
  const priceString = formData.get("price") as string;
  const price = priceString ? parseInt(priceString, 10) : 0;
  const location = formData.get("location") as string;
  const origin = headers().get("origin");

  if (password !== confirmPassword) {
    return encodedRedirect("error", "/streamer-sign-up", "Passwords do not match");
  }

  if (price < 0) {
    return encodedRedirect("error", "/streamer-sign-up", "Price must be 0 or greater");
  }

  // Sign up the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        user_type: 'streamer',
      },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (authError) {
    console.error(authError.message);
    return encodedRedirect("error", "/streamer-sign-up", authError.message);
  }

  if (authData.user) {
    // Insert user data into public.users table
    const { error: profileError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        first_name: firstName,
        last_name: lastName,
        user_type: 'streamer',
        profile_picture_url: null,
        bio: bio,
      });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      await supabase.auth.admin.deleteUser(authData.user.id);
      return encodedRedirect("error", "/streamer-sign-up", "Failed to create user profile: " + profileError.message);
    }

    // Handle image upload
    let imageUrl = null;
    if (image) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${authData.user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('profile_picture')
        .upload(fileName, image);

      if (uploadError) {
        console.error("Error uploading profile picture:", uploadError);
      } else {
        const { data: urlData } = supabase.storage
          .from('profile_picture')
          .getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }
    }

    try {
      // Create streamer profile
      const { data: streamerData, error: streamerError } = await supabase
        .from('streamers')
        .insert({
          user_id: authData.user.id,
          first_name: firstName,
          last_name: lastName,
          platform,
          category,
          price,
          image_url: imageUrl,
          bio,
          location,
          video_url: formData.get('video_url') as string,
          rating: 0, // Add a default rating of 0 for new streamers
        })
        .select()
        .single();

      if (streamerError) throw streamerError;

      // Handle gallery photos
      const galleryPhotos = formData.getAll('gallery');
      for (let i = 0; i < galleryPhotos.length; i++) {
        const photo = galleryPhotos[i] as File;
        const photoPath = `gallery/${authData.user.id}/${Date.now()}_${photo.name}`;
        const { error: uploadError } = await supabase.storage
          .from('gallery_images')
          .upload(photoPath, photo);

        if (uploadError) throw uploadError;

        const { data: photoData } = supabase.storage
          .from('gallery_images')
          .getPublicUrl(photoPath);

        await supabase.from('streamer_gallery_photos').insert({
          streamer_id: streamerData.id,
          photo_url: photoData.publicUrl,
          order_number: i + 1,
        });
      }
    } catch (error: any) {
      console.error('Error creating streamer profile:', error);
      await supabase.auth.admin.deleteUser(authData.user.id);
      return encodedRedirect("error", "/streamer-sign-up", "Failed to create streamer profile: " + error.message);
    }
  }

  revalidatePath("/");
  return redirect("/streamer-dashboard");
}

export async function updateStreamerProfile(formData: FormData) {
  try {
    const cookieStore = cookies();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { error: 'Not authenticated' };
    }

    // Get form data
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const bio = formData.get('bio') as string;
    const youtubeUrl = formData.get('youtubeUrl') as string;
    const image = formData.get('image') as File;
    const galleryPhotos = formData.getAll('galleryPhoto') as File[];

    // Get streamer data with current image_url
    const { data: streamerData, error: streamerFetchError } = await supabase
      .from('streamers')
      .select('id, image_url')
      .eq('user_id', user.id)
      .single();

    if (streamerFetchError) {
      return { error: 'Failed to fetch streamer data' };
    }

    let imageUrl = null;
    // Handle profile image upload
    if (image && image.size > 0) {
      // Delete old image if it exists
      if (streamerData.image_url) {
        try {
          // Get the path after /public/profile_picture/
          const pathMatch = streamerData.image_url.match(/\/public\/profile_picture\/(.+)$/);
          if (pathMatch && pathMatch[1]) {
            const fileName = decodeURIComponent(pathMatch[1]);
            console.log('Full old image URL:', streamerData.image_url);
            console.log('Attempting to delete file:', fileName);

            // List files to verify existence
            const { data: existingFiles, error: listError } = await supabase.storage
              .from('profile_picture')
              .list();

            if (listError) {
              console.error('Error listing files:', listError);
            } else {
              console.log('Existing files:', existingFiles);
            }

            // Delete the file
            const { error: deleteError, data: deleteData } = await supabase.storage
              .from('profile_picture')
              .remove([fileName]);

            if (deleteError) {
              console.error('Error deleting old image:', deleteError);
            } else {
              console.log('Successfully deleted old image:', deleteData);
            }
          }
        } catch (deleteError) {
          console.error('Error during image deletion:', deleteError);
        }
      }

      // Upload new image with simplified path
      const fileExt = image.name.split('.').pop() || 'jpg';
      const fileName = `${uuidv4()}.${fileExt}`;

      const blob = new Blob([image], { type: image.type });

      // Log the upload attempt
      console.log('Attempting to upload new image:', fileName);

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('profile_picture')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: true,
          contentType: image.type
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return { error: 'Failed to upload profile image' };
      }

      console.log('Upload successful:', uploadData);

      const { data: { publicUrl } } = supabase.storage
        .from('profile_picture')
        .getPublicUrl(fileName);

      imageUrl = publicUrl;
      console.log('New image URL:', imageUrl);
    }

    // Update user profile
    const { error: userError } = await supabase
      .from('users')
      .update({
        first_name: firstName,
        last_name: lastName,
        bio: bio,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (userError) {
      return { error: 'Failed to update user profile' };
    }

    // Update streamer profile
    const streamerUpdateData: any = {
      first_name: firstName,
      last_name: lastName,
      video_url: youtubeUrl,
    };

    if (imageUrl) {
      streamerUpdateData.image_url = imageUrl;
    }

    const { error: streamerError } = await supabase
      .from('streamers')
      .update(streamerUpdateData)
      .eq('id', streamerData.id);

    if (streamerError) {
      console.error('Streamer update error:', streamerError);
      return { error: 'Failed to update streamer profile' };
    }

    // Handle gallery photos - Delete old photos before uploading new ones
    if (galleryPhotos.length > 0) {
      // Get existing gallery photos
      const { data: existingGallery } = await supabase
        .from('streamer_gallery_photos')
        .select('photo_url')
        .eq('streamer_id', streamerData.id);

      // Delete old photos from storage
      if (existingGallery) {
        for (const item of existingGallery) {
          const oldPhotoPath = item.photo_url.split('/').pop();
          if (oldPhotoPath) {
            await supabase.storage
              .from('gallery_images')
              .remove([oldPhotoPath]);
          }
        }
      }

      // Delete old gallery entries from database
      await supabase
        .from('streamer_gallery_photos')
        .delete()
        .eq('streamer_id', streamerData.id);

      // Upload new gallery photos
      const newGalleryUrls: string[] = [];
      for (const photo of galleryPhotos) {
        if (photo && photo.size > 0) {
          const fileExt = photo.name.split('.').pop() || 'jpg';
          const fileName = `${uuidv4()}.${fileExt}`;
          const filePath = `gallery_images/${fileName}`;

          const blob = new Blob([photo], { type: photo.type });

          const { error: uploadError } = await supabase.storage
            .from('gallery_images')
            .upload(filePath, blob, {
              cacheControl: '3600',
              upsert: true,
              contentType: photo.type
            });

          if (uploadError) {
            console.error('Gallery upload error:', uploadError);
            continue;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('gallery_images')
            .getPublicUrl(filePath);

          newGalleryUrls.push(publicUrl);
        }
      }

      // Insert new gallery photos
      if (newGalleryUrls.length > 0) {
        const galleryEntries = newGalleryUrls.map((url, index) => ({
          streamer_id: streamerData.id,
          photo_url: url,
          order_number: index,
        }));

        const { error: galleryError } = await supabase
          .from('streamer_gallery_photos')
          .insert(galleryEntries);

        if (galleryError) {
          console.error('Gallery insert error:', galleryError);
        }
      }
    }

    return { 
      success: true, 
      message: 'Profile updated successfully!',
      imageUrl: imageUrl || undefined,
      redirect: '/streamer-dashboard' // Add redirect path
    };

  } catch (error) {
    console.error('Profile update error:', error);
    return { error: 'Failed to update profile' };
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