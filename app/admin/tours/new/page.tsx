export default function NewTourPage() {
  return (
    <div className="section-stack">
      <div>
        <span className="eyebrow">Admin</span>
        <h1>Create tour</h1>
      </div>
      <div className="panel">
        <form action="/api/admin/tours" method="post" className="stack-form">
          <div className="field-grid">
            <label>
              <span>Title</span>
              <input name="title" required />
            </label>
            <label>
              <span>Slug</span>
              <input name="slug" required />
            </label>
            <label>
              <span>Category</span>
              <input name="category" required />
            </label>
            <label>
              <span>Duration type</span>
              <input name="durationType" placeholder="Full Day" required />
            </label>
            <label>
              <span>Price from</span>
              <input name="priceFrom" type="number" step="0.01" required />
            </label>
            <label>
              <span>Image URL</span>
              <input name="imageUrl" />
            </label>
          </div>
          <label>
            <span>Summary</span>
            <textarea name="summary" rows={3} required />
          </label>
          <label>
            <span>Description</span>
            <textarea name="description" rows={6} required />
          </label>
          <label>
            <span>Highlights (comma separated)</span>
            <input name="highlights" placeholder="Cape Point, Boulders Beach, Chapman’s Peak Drive" />
          </label>
          <div className="field-grid">
            <label>
              <span>Featured</span>
              <select name="isFeatured">
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </label>
            <label>
              <span>Private</span>
              <select name="isPrivate">
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </label>
          </div>
          <button className="button">Create tour</button>
        </form>
      </div>
    </div>
  );
}
