import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    
    // Upload to Supabase Storage
    const { data, error } = await supabase
      .storage
      .from('brand-guidelines')
      .upload(`${Date.now()}-${file.name}`, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('brand-guidelines')
      .getPublicUrl(data.path);

    return NextResponse.json({ url: publicUrl });

  } catch (error) {
    console.error('Error handling file upload:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 