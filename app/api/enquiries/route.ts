import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  enquiryReceivedAdminTemplate,
  enquiryReceivedCustomerTemplate,
  getAdminNotificationEmail,
  sendEmail
} from '@/lib/mail';
import { EnquirySchema } from '@/lib/schemas';
import { ZodError } from 'zod';

export async function POST(request: Request) {
  const formData = await request.formData();

  const raw = {
    fullName: String(formData.get('fullName') || '').trim(),
    email: String(formData.get('email') || '').trim(),
    phone: String(formData.get('phone') || '').trim() || null,
    nationality: String(formData.get('nationality') || '').trim() || null,
    travelDate: String(formData.get('travelDate') || '') || null,
    groupSize: String(formData.get('groupSize') || '') || null,
    budgetRange: String(formData.get('budgetRange') || '').trim() || null,
    tripLengthDays: String(formData.get('tripLengthDays') || '') || null,
    message: String(formData.get('message') || '').trim() || null
  };

  let payload;
  try {
    payload = EnquirySchema.parse(raw);
  } catch (err) {
    if (err instanceof ZodError) {
      const firstIssue = err.issues[0]?.message ?? 'Invalid form data';
      const params = new URLSearchParams({ error: firstIssue });
      return NextResponse.redirect(new URL(`/enquiry?${params}`, request.url), 303);
    }
    return NextResponse.redirect(new URL('/enquiry?error=Unknown+error', request.url), 303);
  }

  await prisma.enquiry.create({
    data: { ...payload, source: 'website-enquiry', status: 'New' }
  });

  const adminEmail = getAdminNotificationEmail();
  const adminTemplate = enquiryReceivedAdminTemplate(payload);
  const customerTemplate = enquiryReceivedCustomerTemplate({ fullName: payload.fullName });

  await Promise.allSettled([
    adminEmail
      ? sendEmail({
          to: adminEmail,
          subject: adminTemplate.subject,
          html: adminTemplate.html,
          text: adminTemplate.text,
          replyTo: payload.email
        })
      : Promise.resolve(),
    payload.email
      ? sendEmail({
          to: payload.email,
          subject: customerTemplate.subject,
          html: customerTemplate.html,
          text: customerTemplate.text
        })
      : Promise.resolve()
  ]);

  return NextResponse.redirect(new URL('/enquiry?success=1', request.url), 303);
}
