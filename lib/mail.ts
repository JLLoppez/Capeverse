import nodemailer from 'nodemailer';

export type MailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

function emailEnabled() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.FROM_EMAIL);
}

function getTransporter() {
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || 'false') === 'true' || port === 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

export async function sendEmail(payload: MailPayload) {
  if (!emailEnabled()) {
    return { sent: false, reason: 'smtp-not-configured' as const };
  }

  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    replyTo: payload.replyTo
  });

  return { sent: true as const };
}

export function getAdminNotificationEmail() {
  return process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || '';
}

export function enquiryReceivedAdminTemplate(data: {
  fullName: string;
  email: string;
  phone?: string | null;
  travelDate?: Date | null;
  groupSize?: number | null;
  budgetRange?: string | null;
  tripLengthDays?: number | null;
  nationality?: string | null;
  message?: string | null;
}) {
  const when = data.travelDate ? data.travelDate.toDateString() : 'Not provided';
  return {
    subject: `New Cape Compass enquiry from ${data.fullName}`,
    text: `New enquiry received from ${data.fullName} (${data.email}). Travel date: ${when}. Group size: ${data.groupSize || 'Not provided'}. Budget: ${data.budgetRange || 'Not provided'}. Message: ${data.message || 'No message supplied.'}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;background:#f6f5ef;color:#13261c;">
        <div style="background:linear-gradient(135deg,#0d6f54,#133c34);padding:24px;border-radius:20px;color:#fff;">
          <div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;opacity:.85;">Cape Compass</div>
          <h1 style="margin:10px 0 0;font-size:28px;">New website enquiry</h1>
        </div>
        <div style="background:#fff;border-radius:20px;padding:24px;margin-top:16px;border:1px solid #dde4dc;">
          <p style="margin-top:0;">A new lead has arrived from the public site.</p>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;font-weight:700;">Name</td><td>${data.fullName}</td></tr>
            <tr><td style="padding:8px 0;font-weight:700;">Email</td><td>${data.email}</td></tr>
            <tr><td style="padding:8px 0;font-weight:700;">Phone</td><td>${data.phone || 'Not provided'}</td></tr>
            <tr><td style="padding:8px 0;font-weight:700;">Nationality</td><td>${data.nationality || 'Not provided'}</td></tr>
            <tr><td style="padding:8px 0;font-weight:700;">Travel date</td><td>${when}</td></tr>
            <tr><td style="padding:8px 0;font-weight:700;">Group size</td><td>${data.groupSize || 'Not provided'}</td></tr>
            <tr><td style="padding:8px 0;font-weight:700;">Trip length</td><td>${data.tripLengthDays || 'Not provided'} day(s)</td></tr>
            <tr><td style="padding:8px 0;font-weight:700;">Budget</td><td>${data.budgetRange || 'Not provided'}</td></tr>
          </table>
          <div style="margin-top:18px;padding:16px;border-radius:16px;background:#f8faf8;border:1px solid #e7ece7;">
            <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#0d6f54;font-weight:700;">Client message</div>
            <p style="margin:10px 0 0;white-space:pre-wrap;">${data.message || 'No message supplied.'}</p>
          </div>
        </div>
      </div>
    `
  };
}

export function enquiryReceivedCustomerTemplate(data: { fullName: string }) {
  return {
    subject: 'We received your Cape Compass enquiry',
    text: `Hi ${data.fullName}, thanks for reaching out to Cape Compass. We received your enquiry and a consultant will reply shortly.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;background:#f6f5ef;color:#13261c;">
        <div style="background:linear-gradient(135deg,#0d6f54,#c8922d);padding:28px;border-radius:24px;color:#fff;">
          <div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;opacity:.9;">Cape Compass</div>
          <h1 style="margin:10px 0 10px;font-size:30px;">Your Cape Town planning request is in ✨</h1>
          <p style="margin:0;max-width:420px;line-height:1.6;">Thank you for sharing your travel plans with us. One of our consultants will review your request and come back with the best next step.</p>
        </div>
        <div style="background:#fff;border-radius:20px;padding:24px;margin-top:16px;border:1px solid #dde4dc;">
          <p style="margin-top:0;">Hi ${data.fullName},</p>
          <p>We’ve received your enquiry and our team will follow up with tailored recommendations for your Cape Town stay.</p>
          <p>You can expect help with popular experiences like Cape Point, city tours, Winelands, scenic drives, family-friendly days, and fully custom private itineraries.</p>
          <p style="margin-bottom:0;">Warmly,<br/><strong>Cape Compass Travel Team</strong></p>
        </div>
      </div>
    `
  };
}

export function enquiryStatusTemplate(data: { fullName: string; status: string; notes?: string | null }) {
  return {
    subject: `Your Cape Compass enquiry is now ${data.status}`,
    text: `Hi ${data.fullName}, your enquiry status is now ${data.status}.${data.notes ? ` Notes: ${data.notes}` : ''}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;background:#f6f5ef;color:#13261c;">
        <div style="background:linear-gradient(135deg,#133c34,#0d6f54);padding:24px;border-radius:20px;color:#fff;">
          <div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;opacity:.85;">Cape Compass</div>
          <h1 style="margin:10px 0 0;font-size:28px;">Enquiry update</h1>
        </div>
        <div style="background:#fff;border-radius:20px;padding:24px;margin-top:16px;border:1px solid #dde4dc;">
          <p style="margin-top:0;">Hi ${data.fullName},</p>
          <p>Your enquiry has been updated to <strong>${data.status}</strong>.</p>
          ${data.notes ? `<p><strong>Notes from our team:</strong><br/>${data.notes}</p>` : ''}
          <p style="margin-bottom:0;">We’ll keep you updated as we prepare the best option for your trip.</p>
        </div>
      </div>
    `
  };
}
