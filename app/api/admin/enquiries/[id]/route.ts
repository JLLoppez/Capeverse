import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enquiryStatusTemplate, sendEmail } from '@/lib/mail';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.redirect(new URL('/admin/login', request.url), 303);
  }
  const { id } = await params;
  const formData = await request.formData();
  const status = String(formData.get('status') || 'New');
  const consultantNotes = String(formData.get('consultantNotes') || '');

  const enquiry = await prisma.enquiry.update({
    where: { id },
    data: {
      status,
      consultantNotes
    }
  });

  if (enquiry.email) {
    const template = enquiryStatusTemplate({
      fullName: enquiry.fullName,
      status: enquiry.status,
      notes: enquiry.consultantNotes
    });
    await Promise.allSettled([
      sendEmail({
        to: enquiry.email,
        subject: template.subject,
        html: template.html,
        text: template.text
      })
    ]);
  }

  return NextResponse.redirect(new URL(`/admin/enquiries/${id}?updated=1`, request.url), 303);
}
