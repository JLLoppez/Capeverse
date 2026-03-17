import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function EditTourPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tour = await prisma.tour.findUnique({ where: { id } });
  if (!tour) notFound();
  const highlights = Array.isArray(tour.highlights) ? (tour.highlights as string[]) : [];

  return (
    <div className="section-stack">
      <div>
        <span className="eyebrow">Admin</span>
        <h1>Edit tour</h1>
      </div>
      <div className="panel">
        <form action={`/api/admin/tours/${tour.id}`} method="post" className="stack-form">
          <div className="field-grid">
            <label><span>Title</span><input name="title" defaultValue={tour.title} required /></label>
            <label><span>Slug</span><input name="slug" defaultValue={tour.slug} required /></label>
            <label><span>Category</span><input name="category" defaultValue={tour.category} required /></label>
            <label><span>Duration type</span><input name="durationType" defaultValue={tour.durationType} required /></label>
            <label><span>Price from</span><input name="priceFrom" type="number" step="0.01" defaultValue={Number(tour.priceFrom)} required /></label>
            <label><span>Image URL</span><input name="imageUrl" defaultValue={tour.imageUrl ?? ''} /></label>
          </div>
          <label><span>Summary</span><textarea name="summary" rows={3} defaultValue={tour.summary} required /></label>
          <label><span>Description</span><textarea name="description" rows={6} defaultValue={tour.description} required /></label>
          <label><span>Highlights</span><input name="highlights" defaultValue={highlights.join(', ')} /></label>
          <div className="field-grid">
            <label>
              <span>Featured</span>
              <select name="isFeatured" defaultValue={String(tour.isFeatured)}>
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </label>
            <label>
              <span>Private</span>
              <select name="isPrivate" defaultValue={String(tour.isPrivate)}>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </label>
          </div>
          <div className="field-grid">
            <label>
              <span>Active</span>
              <select name="isActive" defaultValue={String(tour.isActive)}>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </label>
          </div>
          <button className="button">Save changes</button>
        </form>
      </div>
    </div>
  );
}
