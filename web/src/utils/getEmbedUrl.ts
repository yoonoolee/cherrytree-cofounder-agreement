/**
 * The URL to load in the agreement `<iframe>` for a stored PDF link.
 * A Google Drive link (`/file/d/ID/view`, `/file/d/ID` or `open?id=ID`) becomes the
 * Drive viewer's `/file/d/ID/preview` URL; anything else is returned as-is.
 */
export const getEmbedUrl = (url: string): string => {
  if (!url.includes('drive.google.com')) return url;

  const fileId = url.match(/\/file\/d\/([^/?]+)/)?.[1] ?? url.match(/[?&]id=([^&]+)/)?.[1];
  return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : url;
};
