import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function EditAttractionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const attraction = await prisma.attraction.findUnique({ where: { id } });
  if (!attraction) notFound();
  const tags = Array.isArray(attraction.tags) ? (attraction.tags as string[]) : [];

  return (
    <div className="section-stack">
      <div>
        <span className="eyebrow">Admin</span>
        <h1>Edit attraction</h1>
      </div>
      <div className="panel">
        <form action={`/api/admin/attractions/${attraction.id}`} method="post" className="stack-form">
          <div className="field-grid">
            <label><span>Name</span><input name="name" defaultValue={attraction.name} required /></label>
            <label><span>Slug</span><input name="slug" defaultValue={attraction.slug} required /></label>
            <label><span>Region</span><input name="region" defaultValue={attraction.region} required /></label>
            <label><span>Estimated visit minutes</span><input name="estimatedVisitMinutes" type="number" defaultValue={attraction.estimatedVisitMinutes} required /></label>
            <label><span>Entrance fee</span><input name="entranceFee" type="number" step="0.01" defaultValue={attraction.entranceFee ? Number(attraction.entranceFee) : ''} /></label>
            <label><span>Image URL</span><input name="imageUrl" defaultValue={attraction.imageUrl ?? ''} /></label>
          </div>
          <label><span>Short description</span><textarea name="shortDescription" rows={3} defaultValue={attraction.shortDescription} required /></label>
          <label><span>Full description</span><textarea name="fullDescription" rows={6} defaultValue={attraction.fullDescription} required /></label>
          <label><span>Tags</span><input name="tags" defaultValue={tags.join(', ')} /></label>
          <label>
            <span>Active</span>
            <select name="isActive" defaultValue={String(attraction.isActive)}>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </label>
          <button className="button">Save changes</button>
        </form>
      </div>
    </div>
  );
}
