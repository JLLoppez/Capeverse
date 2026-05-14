import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return NextResponse.json(
      { error: 'Image uploads not configured. Set CLOUDINARY_* env vars.' },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'File must be an image' }, { status: 422 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Image must be under 10MB' }, { status: 422 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

  // Sign the upload request
  const timestamp = Math.round(Date.now() / 1000);
  const folder = 'capiverse';
  const { createHash } = await import('crypto');
  const toSign = `folder=${folder}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`;
  const signature = createHash('sha256').update(toSign).digest('hex');

  const cloudinaryForm = new FormData();
  cloudinaryForm.append('file', base64);
  cloudinaryForm.append('timestamp', String(timestamp));
  cloudinaryForm.append('api_key', process.env.CLOUDINARY_API_KEY!);
  cloudinaryForm.append('signature', signature);
  cloudinaryForm.append('folder', folder);
  cloudinaryForm.append('transformation', 'w_1200,h_800,c_fill,q_auto,f_auto');

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: cloudinaryForm }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.json();
    return NextResponse.json({ error: err?.error?.message ?? 'Upload failed' }, { status: 500 });
  }

  const data = await uploadRes.json();
  return NextResponse.json({ url: data.secure_url, publicId: data.public_id });
}
