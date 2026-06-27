import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Fix 7: Block deletion if the tour has any confirmed bookings
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.redirect(new URL('/admin/login', request.url), 303);
  }

  const { id } = await params;

  // Check for confirmed bookings before allowing delete
  const activeBookings = await prisma.booking.count({
    where: { tourId: id, status: 'Confirmed' },
  });

  if (activeBookings > 0) {
    // Redirect back with an error message the admin page can surface
    return NextResponse.redirect(
      new URL(
        `/admin/tours/${id}?error=Cannot+delete+a+tour+with+${activeBookings}+confirmed+booking${activeBookings > 1 ? 's' : ''}.+Cancel+or+move+bookings+first.`,
        request.url
      ),
      303
    );
  }

  await prisma.tour.delete({ where: { id } });
  return NextResponse.redirect(new URL('/admin/tours', request.url), 303);
}
