/** Read a File as a Blob. */
export function fileToBlob(file) {
  return file;
}

/** Create an object URL for displaying a stored blob. */
export function blobToUrl(blob) {
  return URL.createObjectURL(blob);
}

/** Revoke an object URL when no longer needed. */
export function revokeBlobUrl(url) {
  if (url) URL.revokeObjectURL(url);
}

/** Validate that a file is an image. */
export function isImageFile(file) {
  return file && file.type.startsWith('image/');
}
