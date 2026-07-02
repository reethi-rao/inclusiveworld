/**
 * Convert a Google Slides / Drive / generic URL into an embeddable iframe src.
 * Returns null if the URL doesn't look embeddable, so the viewer can fall back
 * to a branded placeholder slide.
 */
export function toEmbedUrl(raw?: string | null): string | null {
  if (!raw) return null;
  const url = raw.trim();
  if (!/^https?:\/\//i.test(url)) return null;

  // Google Slides: .../presentation/d/<id>/edit -> /embed
  const slides = url.match(
    /docs\.google\.com\/presentation\/d\/(e\/)?([a-zA-Z0-9_-]+)/
  );
  if (slides) {
    const isPub = slides[1] === "e/";
    const id = slides[2];
    return isPub
      ? `https://docs.google.com/presentation/d/e/${id}/embed?start=false&loop=false`
      : `https://docs.google.com/presentation/d/${id}/embed?start=false&loop=false`;
  }

  // Google Drive file: .../file/d/<id>/view -> /preview
  const drive = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (drive) {
    return `https://drive.google.com/file/d/${drive[1]}/preview`;
  }

  // Google Docs / Sheets: embed via published/preview
  if (/docs\.google\.com\/(document|spreadsheets)\//.test(url)) {
    return url.replace(/\/(edit|view).*$/, "/preview");
  }

  // Uploaded Office documents (PowerPoint / Word) — render inline through the
  // Microsoft Office online viewer, which needs a publicly reachable URL.
  if (/\.(pptx?|docx?)(\?|$)/i.test(url)) {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
      url
    )}`;
  }

  // PDFs, images, and anything else assumed already embeddable (renders in an
  // iframe directly — e.g. an uploaded PDF Blob or a Canva/SlideShare embed).
  return url;
}
