export default function NewAttractionPage() {
  return (
    <div className="section-stack">
      <div>
        <span className="eyebrow">Admin</span>
        <h1>Create attraction</h1>
      </div>
      <div className="panel">
        <form action="/api/admin/attractions" method="post" className="stack-form">
          <div className="field-grid">
            <label><span className="field-label">Name</span><input name="name" required /></label>
            <label><span className="field-label">Slug</span><input name="slug" required /></label>
            <label><span className="field-label">Region</span><input name="region" required /></label>
            <label><span className="field-label">Estimated visit minutes</span><input name="estimatedVisitMinutes" type="number" required /></label>
            <label><span className="field-label">Entrance fee</span><input name="entranceFee" type="number" step="0.01" /></label>
            <label><span className="field-label">Image URL</span><input name="imageUrl" /></label>
          </div>
          <label><span className="field-label">Short description</span><textarea name="shortDescription" rows={3} required /></label>
          <label><span className="field-label">Full description</span><textarea name="fullDescription" rows={6} required /></label>
          <label><span className="field-label">Tags (comma separated)</span><input name="tags" placeholder="scenic, nature, iconic" /></label>
          <button className="btn btn-ink">Create attraction</button>
        </form>
      </div>
    </div>
  );
}
