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

  const aiChatSummary = String(formData.get('aiChatSummary') || '').trim() || null;

  let payload;
  try {
    payload = EnquirySchema.parse(raw);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? 'Invalid form data' }, { status: 422 });
    }
    return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
  }

  await prisma.enquiry.create({
    data: { ...payload, source: 'website-enquiry', status: 'New', aiChatSummary }
  });

  const adminEmail = getAdminNotificationEmail();
  const adminTemplate = enquiryReceivedAdminTemplate({ ...payload, aiChatSummary });
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

  return NextResponse.json({ success: true });
}
