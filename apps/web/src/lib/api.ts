const API_BASE_URL = 'http://localhost:3001';

export interface UploadResponse {
  success: boolean;
  data: {
    id: string;
    filename: string;
    category: string;
    path: string;
    thumbnailPath?: string;
    mimeType: string;
    size: number;
  };
}

export interface AddAssetsResponse {
  success: boolean;
  message: string;
  data: {
    galleryId: string;
    addedCount: number;
  };
}

export interface Gallery {
  id: string;
  name: string;
  description?: string;
  token: string;
  assets: Array<{
    asset: {
      id: string;
      filename: string;
      path: string;
      thumbnailPath?: string;
      mimeType: string;
      category: string;
    };
  }>;
}
export async function setGalleryCoverPhoto(
  galleryId: string,
  assetId: string | null
): Promise<{ success: boolean; message: string; data: any }> {
  const response = await fetch(
    `${API_BASE_URL}/admin/galleries/${galleryId}/cover`,
    {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ assetId }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to set cover photo');
  }

  return response.json();
}

export interface GalleryResponse {
  success: boolean;
  data: Gallery;
}

export async function uploadAsset(file: File, clientId?: string): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (clientId) {
    formData.append('clientId', clientId);
  }

  const response = await fetch(`${API_BASE_URL}/admin/assets/upload`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Upload failed');
  }

  return response.json();
}
export async function removeAssetFromGallery(
  galleryId: string,
  assetId: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(
    `${API_BASE_URL}/admin/galleries/${galleryId}/assets/${assetId}`,
    {
      method: 'DELETE',
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to remove photo');
  }

  return response.json();
}

export async function addAssetsToGallery(
  galleryId: string,
  assetIds: string[]
): Promise<AddAssetsResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/galleries/${galleryId}/assets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ assetIds }),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to add assets to gallery');
  }

  return response.json();
}

export async function getGallery(galleryId: string): Promise<GalleryResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/galleries/${galleryId}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch gallery');
  }

  return response.json();
}

export async function createGallery(data: {
  name: string;
  description?: string;
  clientId?: string;
}): Promise<{ success: boolean; data: any }> {
  const response = await fetch(`${API_BASE_URL}/admin/galleries`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create gallery');
  }

  return response.json();
}

export async function getAllGalleries(): Promise<{ success: boolean; data: any[] }> {
  const response = await fetch(`${API_BASE_URL}/admin/galleries`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch galleries');
  }

  return response.json();
}
export async function toggleGalleryAssetFavorite(
  galleryId: string,
  assetId: string,
  isFavorite: boolean
): Promise<{ success: boolean; data: any }> {
  const response = await fetch(
    `${API_BASE_URL}/admin/galleries/${galleryId}/assets/${assetId}/favorite`,
    {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isFavorite }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to toggle favorite');
  }

  return response.json();
}
export async function updateGalleryPassword(
  galleryId: string,
  password: string | null
): Promise<{ success: boolean; message: string; data: any }> {
  const response = await fetch(
    `${API_BASE_URL}/admin/galleries/${galleryId}/password`,
    {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update password');
  }

  return response.json();
}
export async function deleteGallery(
  galleryId: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(
    `${API_BASE_URL}/admin/galleries/${galleryId}`,
    {
      method: 'DELETE',
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete gallery');
  }

  return response.json();
}
export async function updateGallery(
  galleryId: string,
  data: { name?: string; description?: string }
): Promise<{ success: boolean; message: string; data: any }> {
  const response = await fetch(
    `${API_BASE_URL}/admin/galleries/${galleryId}`,
    {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update gallery');
  }

  return response.json();
}