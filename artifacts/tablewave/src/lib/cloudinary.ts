export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  folder?: string;
}

export function getCloudinaryConfig(): CloudinaryConfig | null {
  const cloudName = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '').trim();
  const uploadPreset = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '').trim();
  const folder = (import.meta.env.VITE_CLOUDINARY_FOLDER || 'DSD_9').trim();

  if (cloudName && uploadPreset) {
    return { cloudName, uploadPreset, folder };
  }
  return null;
}

export function isCloudinaryConfigured(): boolean {
  return !!getCloudinaryConfig();
}

/**
 * Uploads a File directly to Cloudinary using an unsigned upload preset.
 * Saves into the specified folder (defaults to 'DSD_9').
 * Returns the secure HTTPS URL of the uploaded asset.
 */
export async function uploadImageToCloudinary(
  file: File,
  folder?: string
): Promise<string> {
  const config = getCloudinaryConfig();

  if (!config) {
    throw new Error(
      'Cloudinary is not configured. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your .env.local file.'
    );
  }

  const targetFolder = folder || config.folder || 'DSD_9';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', config.uploadPreset);
  if (targetFolder) {
    formData.append('folder', targetFolder);
  }

  const url = `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/upload`;

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data?.error?.message || response.statusText || 'Upload to Cloudinary failed';
    throw new Error(errorMsg);
  }

  return data.secure_url;
}

/**
 * Converts a File to an optimized base64 data URL for fallback preview
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
